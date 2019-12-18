import { Identifier } from '../../../di/identifiers'
import { ILogger } from '../../../utils/custom.logger'
import { ObjectIdValidator } from '../../domain/validator/object.id.validator'
import { ValidationException } from '../../domain/exception/validation.exception'
import { IUserAuthDataRepository } from '../../port/user.auth.data.repository.interface'
import { Query } from '../../../infrastructure/repository/query/query'
import { IFitbitDataRepository } from '../../port/fitbit.auth.data.repository.interface'
import { UserAuthData } from '../../domain/model/user.auth.data'
import { IIntegrationEventHandler } from './integration.event.handler.interface'
import { UserDeleteEvent } from '../event/user.delete.event'
import { inject } from 'inversify'

/**
 * Handler for UserDeleteEvent operation.
 *
 * @param event
 */

export class UserDeleteEventHandler implements IIntegrationEventHandler<UserDeleteEvent> {
    constructor(
        @inject(Identifier.FITBIT_DATA_REPOSITORY) readonly fitbitAuthDataRepo: IFitbitDataRepository,
        @inject(Identifier.USER_AUTH_DATA_REPOSITORY) readonly userAuthDataRepo: IUserAuthDataRepository,
        @inject(Identifier.FITBIT_DATA_REPOSITORY) readonly logger: ILogger
    ) {
    }

    public async handle(event: UserDeleteEvent): Promise<void> {
        try {
            if (typeof event === 'string') event = JSON.parse(event)
            if (!event.user && !event.user.id) {
                throw new ValidationException('Event received but could not be handled due to an error in the event format.')
            }
            const childId: string = event.user.id

            // 1. Validate childId.
            ObjectIdValidator.validate(childId)

            // 2. Delete Child Data
            const query: Query = new Query().fromJSON({ filters: { user_id: childId } })
            const userAuthData: UserAuthData = await this.userAuthDataRepo.findOne(query)
            if (userAuthData) {
                const payload: any = await this.fitbitAuthDataRepo.getTokenPayload(userAuthData.fitbit!.access_token!)
                if (payload || payload.scopes) {
                    const scopes: Array<string> = payload.scopes.split(' ')
                    if (scopes.includes('rwei')) { // Scope reference from fitbit to weight data is rwei
                        await this.fitbitAuthDataRepo.unsubscribeUserEvent(userAuthData.fitbit!, 'body', 'BODY')
                    }
                    if (scopes.includes('ract')) { // Scope reference from fitbit to activity data is ract
                        await this.fitbitAuthDataRepo.unsubscribeUserEvent(userAuthData.fitbit!, 'activities', 'ACTIVITIES')
                    }
                    if (scopes.includes('rsle')) { // Scope reference from fitbit to sleep data is rsle
                        await this.fitbitAuthDataRepo.unsubscribeUserEvent(userAuthData.fitbit!, 'sleep', 'SLEEP')
                    }
                }
                await this.userAuthDataRepo.deleteByQuery(query)

                // 3. If got here, it's because the action was successful.
                this.logger.info(`Action for event ${event.event_name} successfully held!`)
            }
        } catch (err) {
            this.logger.warn(`An error occurred while attempting `
                .concat(`perform the operation with the ${event.event_name} name event. ${err.message}`)
                .concat(err.description ? ' ' + err.description : ''))
        }
    }

}
