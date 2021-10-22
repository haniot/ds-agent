import { IBackgroundTask } from '../../application/port/background.task.interface'
import { inject, injectable } from 'inversify'
import cron from 'node-cron'
import { Identifier } from '../../di/identifiers'
import { IUserAuthDataService } from '../../application/port/user.auth.data.service.interface'
import { ILogger } from '../../utils/custom.logger'
import { Query } from '../../infrastructure/repository/query/query'
import { UserAuthData } from '../../application/domain/model/user.auth.data'
import { IFitbitDeviceService } from '../../application/port/fitbit.device.service.interface'
import { Device } from '../../application/domain/model/device'
import moment from 'moment'
import { Fitbit } from '../../application/domain/model/fitbit'
import { FitbitNoDeviceEvent } from '../../application/integration-event/event/fitbit.no.device.event'
import { FitbitInactiveEvent } from '../../application/integration-event/event/fitbit.inactive.event'
import { IEventBus } from '../../infrastructure/port/event.bus.interface'
import { IQuery } from '../../application/port/query.interface'

/**
 * Task responsible for identifying inactive users and invalidating them.
 */
@injectable()
export class InactiveUsersTask implements IBackgroundTask {
    private schedule: any

    constructor(
        @inject(Identifier.RABBITMQ_EVENT_BUS) private readonly _eventBus: IEventBus,
        @inject(Identifier.USER_AUTH_DATA_SERVICE) private readonly _userAuthDataService: IUserAuthDataService,
        @inject(Identifier.FITBIT_DEVICE_SERVICE) private readonly _deviceService: IFitbitDeviceService,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger,
        private readonly daysInactive: number,
        private readonly expressionInactiveUsers?: string
    ) {
    }

    public async run(): Promise<void> {
        try {
            if (this.expressionInactiveUsers) {
                // Initialize crontab.
                this.schedule = cron.schedule(`${this.expressionInactiveUsers}`,
                    async () => await this.findInactiveUsers(), {
                        scheduled: false
                    })
                this.schedule.start()
            } else await this.findInactiveUsers()

            this._logger.debug('Fitbit inactive users task started successfully!')
        } catch (err: any) {
            this._logger.error(`An error occurred initializing the Fitbit inactive users task. ${err.message}`)
        }
    }

    public stop(): Promise<void> {
        if (this.expressionInactiveUsers) this.schedule.stop()
        return Promise.resolve()
    }

    private async findInactiveUsers(): Promise<void> {
        try {
            const queryUsers: IQuery = new Query()
            queryUsers.addFilter({ 'fitbit.status': 'valid_token' })

            const userAuthDataArr: Array<UserAuthData> = await this._userAuthDataService.getAll(queryUsers)
            if (userAuthDataArr.length) {
                // Finds all devices of each user.
                for (const user of userAuthDataArr) {
                    const userId = user.user_id!

                    // Build query for devices.
                    const queryDevices: IQuery = new Query()
                    queryDevices.ordination.set('last_sync', -1)
                    queryDevices.pagination.limit = Number.MAX_SAFE_INTEGER
                    queryDevices.addFilter({ user_id: userId })

                    const devices: Array<Device> = await this._deviceService.getAllByUser(userId, queryDevices)

                    // Goal 1.
                    let daysDiff = moment().diff(moment(user.updated_at), 'days')
                    if (!devices.length) {
                        // Publish FitbitNoDeviceEvent
                        this._pubNoDeviceEvent(userId)

                        if (daysDiff >= this.daysInactive) {
                            // Revoke User's Fitbit access
                            await this._userAuthDataService.revokeFitbitAccessToken(userId)

                            // Publish FitbitInactiveEvent
                            this._pubInactiveEvent(userId)
                        }

                        continue
                    }
                    // Goal 2.
                    daysDiff = moment().diff(moment(devices[0].last_sync), 'days')
                    if (daysDiff >= this.daysInactive) {
                        await this._userAuthDataService.revokeFitbitAccessToken(userId)
                        this._pubInactiveEvent(userId)
                    }
                }
            }
        } catch (err: any) {
            this._logger.error(`An error occurred while trying to retrieve Users Fitbit data. ${err.message}`)
        }
    }

    private _pubNoDeviceEvent(userId: string): void {
        const fitbit: Fitbit = new Fitbit().fromJSON({ user_id: userId })

        this._eventBus
            .publish(new FitbitNoDeviceEvent(new Date(), fitbit), FitbitNoDeviceEvent.ROUTING_KEY)
            .then(() => this._logger.info(`FitbitNoDeviceEvent for user with ID ${userId} ` +
                'successfully published!'))
            .catch(err => this._logger.error('An error occurred while publishing ' +
                `FitbitNoDeviceEvent for user with ID ${userId}. ${err.message}`))
    }

    private _pubInactiveEvent(userId: string): void {
        const fitbit: Fitbit = new Fitbit().fromJSON({ user_id: userId })

        this._eventBus
            .publish(new FitbitInactiveEvent(new Date(), fitbit), FitbitInactiveEvent.ROUTING_KEY)
            .then(() => this._logger.info(`FitbitInactiveEvent for user with ID ${userId} ` +
                'successfully published!'))
            .catch(err => this._logger.error('An error occurred while publishing ' +
                `FitbitInactiveEvent for user with ID ${userId}. ${err.message}`))
    }
}
