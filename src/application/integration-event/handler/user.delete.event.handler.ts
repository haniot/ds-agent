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
import { IResourceRepository } from '../../port/resource.repository.interface'

/**
 * Handler for UserDeleteEvent operation.
 *
 * @param event
 */

export class UserDeleteEventHandler implements IIntegrationEventHandler<UserDeleteEvent> {
    constructor(
        @inject(Identifier.FITBIT_DATA_REPOSITORY) readonly fitbitAuthDataRepo: IFitbitDataRepository,
        @inject(Identifier.USER_AUTH_DATA_REPOSITORY) readonly userAuthDataRepo: IUserAuthDataRepository,
        @inject(Identifier.RESOURCE_REPOSITORY) readonly resourceRepo: IResourceRepository,
        @inject(Identifier.FITBIT_DATA_REPOSITORY) readonly logger: ILogger
    ) {
    }

    public async handle(event: UserDeleteEvent): Promise<void> {
        try {
            if (!event.user || !event.user.id) {
                throw new ValidationException('Event received but could not be handled due to an error in the event format.')
            }
            const userId: string = event.user.id

            // 1. Validate userId.
            ObjectIdValidator.validate(userId)

            // 2. Delete Child Data
            const query: Query = new Query().fromJSON({ filters: { user_id: userId } })
            const userAuthData: UserAuthData = await this.userAuthDataRepo.findOne(query)
            if (userAuthData) {
                if (userAuthData.fitbit?.access_token) {
                     this.fitbitAuthDataRepo.revokeToken(userAuthData.fitbit.access_token).then()
                }
                await this.userAuthDataRepo.deleteByQuery(query)
                await this.resourceRepo.deleteByQuery(query)

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
