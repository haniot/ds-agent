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
import { VerifyFitbitAuthValidator } from '../domain/validator/verify.fitbit.auth.validator'
import { IEventBus } from '../../infrastructure/port/event.bus.interface'
import { FitbitErrorEvent } from '../integration-event/event/fitbit.error.event'
import { FitbitRevokeEvent } from '../integration-event/event/fitbit.revoke.event'
import { FitbitLastSyncEvent } from '../integration-event/event/fitbit.last.sync.event'

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
        return new Promise<UserAuthData>(async (resolve, reject) => {
            try {
                const authData: UserAuthData = await this.manageFitbitAuthData(item)
                CreateUserAuthDataValidator.validate(item)
                let result: UserAuthData = new UserAuthData()

                authData.fitbit!.status = 'valid_token'
                await this.subscribeFitbitEvents(item)

                const alreadySaved: UserAuthData = await this._userAuthDataRepo
                    .findOne(new Query().fromJSON({ filters: { user_id: authData.user_id! } }))
                if (alreadySaved) {
                    authData.id = alreadySaved.id
                    result = await this._userAuthDataRepo.update(authData)
                } else {
                    result = await this._userAuthDataRepo.create(authData)
                }

                if (authData.fitbit && authData.fitbit.last_sync) {
                    this._eventBus
                        .publish(new FitbitLastSyncEvent(new Date(), {
                            patient_id: authData.user_id,
                            last_sync: authData.fitbit.last_sync
                        }), 'fitbit.lastsync')
                        .then(() => this._logger.info(`Last sync from ${authData.user_id} successful published!`))
                        .catch(err => this._logger.error(`Error at publish last sync: ${err.message}`))
                }
                return resolve(result)
            } catch (err) {
                return reject(err)
            }
        })
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

    public revokeFitbitAccessToken(userId: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let authData: UserAuthData
            try {
                ObjectIdValidator.validate(userId)

                // 1. Check if user has authorization data saved.
                authData = await this._userAuthDataRepo
                    .findOne(new Query().fromJSON({ filters: { user_id: userId } }))
                if (!authData || !authData.fitbit || !authData.fitbit.access_token) {
                    return resolve()
                }

                // 2. Unsubscribe from Fitbit events.
                await this.unsubscribeFitbitEvents(authData)

                // 3. Revokes Fitbit access token.
                // 4. Remove Fitbit authorization data from local database.

                const isRevoked: boolean = await this._fitbitAuthDataRepo.revokeToken(authData.fitbit.access_token)
                const isDeleted: boolean = await this._fitbitAuthDataRepo.removeFitbitAuthData(userId)
                if (isRevoked && isDeleted) {
                    // 5. Publish the Fitbit revoke event on the bus.
                    this._eventBus
                        .publish(new FitbitRevokeEvent(new Date(), userId), 'fitbit.revoke')
                        .then(() => this._logger.info(`Fitbit revoke event for patient ${userId} successfully published!`))
                        .catch((err) => this._logger.error('There was an error publishing Fitbit' +
                            `revoke event for patient ${userId}. ${err.message}`))
                }
                return resolve()
            } catch (err) {
                if (err.type) {
                    if (err.type === 'expired_token') {
                        this._fitbitAuthDataRepo
                            .refreshToken(userId, authData!.fitbit!.access_token!, authData!.fitbit!.refresh_token!)
                            .then(async newToken => {
                                await this.revokeFitbitAccessToken(userId)
                                return resolve()
                            }).catch(err => {
                            if (err.type !== 'system') this.updateTokenStatus(userId, err.type)
                        })
                    }
                    this.publishFitbitAuthError(err, userId)
                }
                return resolve()
            }
        })
    }

    private syncFitbitData(data: FitbitAuthData, userId: string): Promise<DataSync> {
        try {
            VerifyFitbitAuthValidator.validate(data)
            return this._fitbitAuthDataRepo.syncFitbitData(data, userId)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    public async syncFitbitDataFromUser(userId: string): Promise<DataSync> {
        return new Promise<DataSync>((resolve, reject) => {
            try {
                ObjectIdValidator.validate(userId)
                this._userAuthDataRepo
                    .getUserAuthDataByUserId(userId)
                    .then(async data => {
                        if (!data || !data.fitbit || !data.fitbit!.access_token) {
                            throw new ValidationException(
                                'User does not have authentication data. Please, submit authentication data and try again.'
                            )
                        }
                        try {
                            const result: DataSync = await this.syncFitbitData(data.fitbit!, userId)
                            return resolve(result)
                        } catch (err) {
                            if (err.type) {
                                if (err.type === 'expired_token') {
                                    this._fitbitAuthDataRepo
                                        .refreshToken(userId, data.fitbit!.access_token!, data.fitbit!.refresh_token!)
                                        .then(async newToken => {
                                            const result: DataSync = await this.syncFitbitData(newToken, userId)
                                            return resolve(result)
                                        }).catch(err => {
                                        if (err.type !== 'system') this.updateTokenStatus(userId, err.type)
                                        this.publishFitbitAuthError(err, userId)
                                        return reject(err)
                                    })
                                } else if (err.type === 'client_error') {
                                    try {
                                        const result: DataSync = await this.syncFitbitData(data.fitbit, userId)
                                        return resolve(result)
                                    } catch (err) {
                                        return reject(err)
                                    }
                                } else {
                                    if (err.type !== 'system') this.updateTokenStatus(userId, err.type)
                                    this.publishFitbitAuthError(err, userId)
                                    return reject(err)
                                }
                            } else {
                                return reject(err)
                            }
                        }
                    })
                    .catch(reject)
            } catch (err) {
                return reject(err)
            }
        })
    }

    public async syncLastFitbitUserData(fitbitUserId: string, type: string, date: string): Promise<void> {
        try {
            const authData: UserAuthData =
                await this._userAuthDataRepo
                    .findOne(new Query().fromJSON({ filters: { 'fitbit.user_id': fitbitUserId } }))
            if (!authData || !authData.fitbit || !authData.fitbit!.access_token) return await Promise.resolve()
            this.syncLastFitbitData(authData.fitbit!, authData.user_id!, type, date)
                .then()
                .catch(err => this._logger.error(`The resource ${type} from ${authData.user_id} could note be sync: ` +
                    err.message))
            return await Promise.resolve()
        } catch (err) {
            return await Promise.reject(err)
        }
    }

    private async syncLastFitbitData(data: FitbitAuthData, userId: string, type: string, date: string): Promise<void> {
        try {
            VerifyFitbitAuthValidator.validate(data)
            await this._fitbitAuthDataRepo.syncLastFitbitData(data, userId, type, date)
            return Promise.resolve()
        } catch (err) {
            if (err.type) {
                if (err.type === 'expired_token') {
                    try {
                        const newToken: FitbitAuthData =
                            await this._fitbitAuthDataRepo.refreshToken(userId, data.access_token!, data.refresh_token!)
                        this.syncLastFitbitData(newToken, userId, type, date)
                            .then()
                            .catch(err => {
                                this.updateTokenStatus(userId, err.type)
                                this.publishFitbitAuthError(err, userId)
                                return Promise.reject(err)
                            })
                    } catch (err) {
                        if (err.type !== 'system') this.updateTokenStatus(userId, err.type)
                        this.publishFitbitAuthError(err, userId)
                        return Promise.reject(err)
                    }
                } else if (err.type === 'client_error') {
                    try {
                        await this.syncFitbitData(data, userId)
                    } catch (err) {
                        return Promise.reject(err)
                    }
                } else {
                    if (err.type !== 'system') this.updateTokenStatus(userId, err.type)
                    this.publishFitbitAuthError(err, userId)
                    return Promise.reject(err)
                }
            } else {
                return await Promise.reject(err)
            }
        }
    }

    private async subscribeFitbitEvents(data: UserAuthData): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (!data || !data.fitbit || !data.fitbit.scope) return

                const scopes: Array<string> = data.fitbit.scope.split(' ')

                if (scopes.includes('rwei')) { // Scope reference from fitbit to weight data is rwei
                    await this._fitbitAuthDataRepo.subscribeUserEvent(data.fitbit!, 'body', 'BODY')
                }
                if (scopes.includes('ract')) { // Scope reference from fitbit to activity data is ract
                    await this._fitbitAuthDataRepo.subscribeUserEvent(data.fitbit!, 'activities', 'ACTIVITIES')
                }
                if (scopes.includes('rsle')) { // Scope reference from fitbit to sleep data is rsle
                    await this._fitbitAuthDataRepo.subscribeUserEvent(data.fitbit!, 'sleep', 'SLEEP')
                }
                return resolve()
            } catch (err) {
                return reject(err)
            }
        })
    }

    private async unsubscribeFitbitEvents(data: UserAuthData): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!data || !data.fitbit || !data.fitbit.scope) return

                const scopes: Array<string> = data.fitbit.scope.split(' ')
                if (scopes.includes('rwei')) { // Scope reference from fitbit to weight data is rwei
                    await this._fitbitAuthDataRepo.unsubscribeUserEvent(data.fitbit!, 'body', 'BODY')
                }
                if (scopes.includes('ract')) { // Scope reference from fitbit to activity data is ract
                    await this._fitbitAuthDataRepo.unsubscribeUserEvent(data.fitbit!, 'activities', 'ACTIVITIES')
                }
                if (scopes.includes('rsle')) { // Scope reference from fitbit to sleep data is rsle
                    await this._fitbitAuthDataRepo.unsubscribeUserEvent(data.fitbit!, 'sleep', 'SLEEP')
                }
                return resolve()
            } catch (err) {
                return reject(err)
            }
        })
    }

    private async manageFitbitAuthData(data: UserAuthData): Promise<UserAuthData> {
        return new Promise(async (resolve, reject) => {
            try {
                if (!data || !data.fitbit || !data.fitbit.access_token) {
                    return resolve(data)
                }
                const payload: any = await this._fitbitAuthDataRepo.getTokenPayload(data.fitbit!.access_token!)
                if (payload.sub) data.fitbit!.user_id = payload.sub
                if (payload.scopes) data.fitbit!.scope = payload.scopes
                if (payload.exp) data.fitbit!.expires_in = payload.exp
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
        const fitbit: any = {
            patient_id: userId,
            error: { code: 0, message: error.message, description: error.description }
        }

        switch (error.type) {
            case 'expired_token':
                fitbit.error.code = 1011
                break
            case 'invalid_token':
                fitbit.error.code = 1012
                break
            case 'invalid_grant':
                fitbit.error.code = 1021
                break
            case 'invalid_client':
                fitbit.error.code = 1401
                break
            case 'system':
                fitbit.error.code = 1429
                break
            default:
                fitbit.error.code = 1500
                break
        }

        this._logger.error(`Fitbit error: ${JSON.stringify(fitbit)}`)
        this._eventBus
            .publish(new FitbitErrorEvent(new Date(), fitbit), 'fitbit.error')
            .then(() => this._logger.info(`Error message about ${error.type} from ${userId} successful published!`))
            .catch(err => this._logger.error(`Error at publish error message from ${userId}: ${err.message}`))
    }
}
