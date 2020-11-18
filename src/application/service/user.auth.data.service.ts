import { IQuery } from '../port/query.interface'
import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { IUserAuthDataRepository } from '../port/user.auth.data.repository.interface'
import { UserAuthData } from '../domain/model/user.auth.data'
import { CreateUserAuthDataValidator } from '../domain/validator/create.user.auth.data.validator'
import { IFitbitDataRepository } from '../port/fitbit.auth.data.repository.interface'
import { IUserAuthDataService } from '../port/user.auth.data.service.interface'
import { Query } from '../../infrastructure/repository/query/query'
import { ValidationException } from '../domain/exception/validation.exception'
import { FitbitAuthData } from '../domain/model/fitbit.auth.data'
import { ObjectIdValidator } from '../domain/validator/object.id.validator'
import { ILogger } from '../../utils/custom.logger'
import { DataSync } from '../domain/model/data.sync'
import { IEventBus } from '../../infrastructure/port/event.bus.interface'
import { FitbitErrorEvent } from '../integration-event/event/fitbit.error.event'
import { FitbitRevokeEvent } from '../integration-event/event/fitbit.revoke.event'
import moment from 'moment'
import { FitbitClientException } from '../domain/exception/fitbit.client.exception'
import { Strings } from '../../utils/strings'
import { VerifyFitbitAuthValidator } from '../domain/validator/verify.fitbit.auth.validator'
import { AccessTokenScopesValidator } from '../domain/validator/access.token.scopes.validator'
import { RepositoryException } from '../domain/exception/repository.exception'
import { FitbitTokenGrantedEvent } from '../integration-event/event/fitbit.token.granted.event'
import { Fitbit } from '../domain/model/fitbit'

@injectable()
export class UserAuthDataService implements IUserAuthDataService {
    constructor(
        @inject(Identifier.USER_AUTH_DATA_REPOSITORY) private readonly _userAuthDataRepo: IUserAuthDataRepository,
        @inject(Identifier.FITBIT_DATA_REPOSITORY) private readonly _fitbitAuthDataRepo: IFitbitDataRepository,
        @inject(Identifier.RABBITMQ_EVENT_BUS) public readonly _eventBus: IEventBus,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
    }

    public async add(item: UserAuthData): Promise<UserAuthData> {
        try {
            const authData: UserAuthData = await this.manageFitbitAuthData(item)
            CreateUserAuthDataValidator.validate(item)

            // 1. Verify if the token is active (valid)
            const isTokenActive: boolean = await this._fitbitAuthDataRepo.getTokenIntrospect(authData.fitbit?.access_token!)
            if (!isTokenActive) {
                throw new FitbitClientException(
                    'invalid_token',
                    Strings.FITBIT_ERROR.INVALID_ACCESS_TOKEN.replace('{0}', authData.fitbit?.access_token!))
            }

            authData.fitbit!.status = 'valid_token'

            // 2. Verify if already exists an token associated with the user
            const alreadySaved: UserAuthData = await this._userAuthDataRepo
                .findOne(new Query().fromJSON({ filters: { user_id: authData.user_id! } }))

            // 3. f the user has no token, the new token will be associated with the user
            if (!alreadySaved) {
                const newAuthData: UserAuthData = await this._userAuthDataRepo.create(authData)
                if (newAuthData) this.publishFitbitTokenGranted(item.user_id!)
                return Promise.resolve(newAuthData)
            }

            // 4. If the user has a token, it will be updated with the new token
            authData.id = alreadySaved.id
            const updatedAuthData: UserAuthData = await this._userAuthDataRepo.update(authData)
            if (updatedAuthData) this.publishFitbitTokenGranted(item.user_id!)
            return Promise.resolve(updatedAuthData)
        } catch (err) {
            if (err.type) return Promise.reject(this.manageFitbitAuthError(err))
            return Promise.reject(err)
        }
    }

    public getAll(query: IQuery): Promise<Array<UserAuthData>> {
        return this._userAuthDataRepo.find(query)
    }

    public getById(id: string, query: IQuery): Promise<UserAuthData> {
        return this._userAuthDataRepo.findOne(query)
    }

    public remove(id: string): Promise<boolean> {
        throw Error('Not implemented!')
    }

    public update(item: UserAuthData): Promise<UserAuthData> {
        throw Error('Not implemented!')
    }

    public getByUserId(userId: string): Promise<UserAuthData> {
        try {
            ObjectIdValidator.validate(userId)
        } catch (err) {
            return Promise.reject(err)
        }
        return this._userAuthDataRepo.findOne(new Query().fromJSON({ filters: { user_id: userId } }))
    }

    public async revokeFitbitAccessToken(userId: string): Promise<void> {
        // Anonymous function used to publish revoke event
        const fitbit: Fitbit = new Fitbit().fromJSON({
            user_id: userId,
            timestamp: new Date()
        })

        const pubRevokeEvent = () => {
            this._eventBus
                .publish(new FitbitRevokeEvent(new Date(), fitbit), FitbitRevokeEvent.ROUTING_KEY)
                .then(() => this._logger.info(`Fitbit revoke event for user ${userId} successfully published!`))
                .catch((err) => this._logger.error('There was an error publishing Fitbit' +
                    `revoke event for user ${userId}. ${err.message}`))
        }
        try {
            ObjectIdValidator.validate(userId)

            // 1. Check if user has authorization data saved.
            const authData: UserAuthData =
                await this._userAuthDataRepo.findOne(new Query().fromJSON({ filters: { user_id: userId } }))

            if (!authData || !authData.fitbit?.access_token) {
                pubRevokeEvent()
                return Promise.resolve()
            }

            // 2. Check if token is expired.
            const now: number = moment().add(5, 'minute').unix()
            if (now > authData.fitbit?.expires_in!) {
                const newAuthData: FitbitAuthData =
                    await this._fitbitAuthDataRepo
                        .refreshToken(userId, authData.fitbit.access_token, authData.fitbit.refresh_token!)
                authData.fitbit = newAuthData
            }

            // 3. Revokes Fitbit access token.
            await this._fitbitAuthDataRepo.revokeToken(authData.fitbit.access_token!)

            // 4. Remove Fitbit authorization data from local database.
            this._fitbitAuthDataRepo.removeFitbitAuthData(userId).then().catch()

            // We can treat revoke as a success
            pubRevokeEvent()
            return Promise.resolve()
        } catch (err) {
            // Only if The error is a ValidationException or RepositoryException, reject it
            if (err instanceof ValidationException || err instanceof RepositoryException) {
                return Promise.reject(err)
            }
            // If the access token or the refresh token is invalid, remove the fitbit auth data form user
            if (err.type && ['invalid_token', 'invalid_grant'].includes(err.type)) {
                await this._fitbitAuthDataRepo.removeFitbitAuthData(userId)
            }
            // We can treat revoke as a success
            pubRevokeEvent()
            return Promise.resolve()
        }
    }

    public async syncFitbitDataFromUser(userId: string): Promise<DataSync> {
        // Anonymous function used to refresh token
        const refreshToken = (authData: FitbitAuthData) => {
            return this._fitbitAuthDataRepo.refreshToken(userId, authData.access_token!, authData.refresh_token!)
        }

        try {
            ObjectIdValidator.validate(userId)

            // 1. Check if user have fitbit auth data
            const authData: UserAuthData = await this._userAuthDataRepo.getUserAuthDataByUserId(userId)
            if (!authData || !authData.fitbit?.access_token) {
                throw new ValidationException(
                    'User does not have authentication data. Please, submit authentication data and try again.')
            }

            // 2. Verify if the authentication data has at least one of the resource scopes from the synchronization process
            AccessTokenScopesValidator.validate(authData)

            // 3. Verify if the token is active
            // If the token is not active, try to refresh it
            const isTokenActive: boolean = await this._fitbitAuthDataRepo.getTokenIntrospect(authData.fitbit?.access_token!)
            if (!isTokenActive) authData.fitbit = await refreshToken(authData.fitbit)

            // 4. Verify if the token is expired. In positive match, refresh the token before continue.
            VerifyFitbitAuthValidator.validate(authData.fitbit)
            const now: number = moment().add(5, 'minute').unix()
            if (now > authData.fitbit.expires_in!) authData.fitbit = await refreshToken(authData.fitbit)

            // 5. Proceed with the sync
            const result: DataSync = await this._fitbitAuthDataRepo.syncFitbitData(authData.fitbit, userId)
            return Promise.resolve(result)
        } catch (err) {
            if (err.type) {
                // If the access token is invalid, it is necessary to update token status
                if (err.type === 'invalid_token') this.updateTokenStatus(userId, err.type)

                // If the refresh token is invalid, remove the fitbit auth data form user
                else if (err.type === 'invalid_grant') await this._fitbitAuthDataRepo.removeFitbitAuthData(userId)

                // If the error was generated by a client or internal error, it not necessary to publish it in message channel
                if (!(['internal_error', 'client_error'].includes(err.type))) this.publishFitbitAuthError(err, userId)
                return Promise.reject(this.manageFitbitAuthError(err))
            }
            return Promise.reject(err)
        }
    }

    private async manageFitbitAuthData(data: UserAuthData): Promise<UserAuthData> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!data?.fitbit?.access_token) return resolve(data)
                const payload: any = await this._fitbitAuthDataRepo.getTokenPayload(data.fitbit.access_token)
                if (payload.sub) data.fitbit.user_id = payload.sub
                if (payload.scopes) data.fitbit.scope = payload.scopes
                if (payload.exp) data.fitbit.expires_in = payload.exp
                data.fitbit!.token_type = 'Bearer'
                return resolve(data)
            } catch (err) {
                return reject(err)
            }
        })
    }

    private updateTokenStatus(userId: string, status: string): void {
        this._fitbitAuthDataRepo.updateTokenStatus(userId, status)
            .then()
            .catch(err => this._logger.error(`Error at update token status from ${userId}: ${err.message}`))
    }

    /*
    * Publish Fitbit Token Granted Event
    */
    private publishFitbitTokenGranted(userId: string): void {
        const fitbit: Fitbit = new Fitbit().fromJSON({
            user_id: userId,
            timestamp: new Date()
        })
        this._eventBus
            .publish(new FitbitTokenGrantedEvent(new Date(), fitbit), FitbitTokenGrantedEvent.ROUTING_KEY)
            .then(() => this._logger.info(`Fitbit token granted from ${userId} successful published!`))
            .catch(err => this._logger.error(`Error at publish fitbit token granted from ${userId}: ${err.message}`))
    }

    /*
   * Publish Error according to the type.
   * Mapped Error Codes:
   *
   * 1011 - Expired Token
   * 1012 - Invalid Token
   * 1021 - Invalid Refresh Token
   * 1401 - Invalid Client Credentials
   * 1429 - Too Many Requests
   * 1500 - Generic Error
   */
    private publishFitbitAuthError(error: any, userId: string): void {
        const fitbit: Fitbit = new Fitbit().fromJSON({
            user_id: userId,
            error: this.manageFitbitAuthError(error)
        })

        this._logger.error(`Fitbit error: ${JSON.stringify(fitbit.toJSON())}`)
        this._eventBus
            .publish(new FitbitErrorEvent(new Date(), fitbit), FitbitErrorEvent.ROUTING_KEY)
            .then(() => this._logger.info(`Error message about ${error.type} from ${userId} successful published!`))
            .catch(err => this._logger.error(`Error at publish error message from ${userId}: ${err.message}`))
    }

    private manageFitbitAuthError(error: any): any {
        const result: any = { code: 0, message: error.message, description: error.description }
        switch (error.type) {
            case 'expired_token':
                result.code = 1011 // 400
                break
            case 'invalid_token':
                result.code = 1012 // 400
                break
            case 'invalid_grant':
                result.code = 1021 // 400
                break
            case 'invalid_client': // 403
                result.code = 1401
                break
            case 'system':
                result.code = 1429 // 429
                break
            default:
                result.code = 1500 // 500
                break
        }
        return result
    }
}
