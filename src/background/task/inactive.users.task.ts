import { IBackgroundTask } from '../../application/port/background.task.interface'
import { inject, injectable } from 'inversify'
import cron from 'node-cron'
import { Identifier } from '../../di/identifiers'
import { IUserAuthDataService } from '../../application/port/user.auth.data.service.interface'
import { ILogger } from '../../utils/custom.logger'
import { Default } from '../../utils/default'
import { Query } from '../../infrastructure/repository/query/query'
import { UserAuthData } from '../../application/domain/model/user.auth.data'
import { IFitbitDeviceService } from '../../application/port/fitbit.device.service.interface'
import { Device } from '../../application/domain/model/device'
import moment from 'moment'

/**
 * Task responsible for identifying inactive users and invalidating them.
 */
@injectable()
export class InactiveUsersTask implements IBackgroundTask {
    private schedule: any
    private readonly daysInactive: number = Number(process.env.DAYS_INACTIVE_USERS) || Default.DAYS_INACTIVE_USERS

    constructor(
        @inject(Identifier.USER_AUTH_DATA_SERVICE) private readonly _userAuthDataService: IUserAuthDataService,
        @inject(Identifier.FITBIT_DEVICE_SERVICE) private readonly _deviceService: IFitbitDeviceService,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
        this.schedule = cron.schedule(`${process.env.EXPRESSION_INACTIVE_USERS || Default.EXPRESSION_INACTIVE_USERS}`,
            () => this.findInactiveUsers(), {
                scheduled: false
            })
    }

    public async run(): Promise<void> {
        try {
            // Initialize crontab.
            this.schedule.start()

            this._logger.debug('Fitbit inactive users task started successfully!')
        } catch (err) {
            this._logger.error(`An error occurred initializing the Fitbit inactive users task. ${err.message}`)
        }
    }

    public stop(): Promise<void> {
        this.schedule.destroy()
        return Promise.resolve()
    }

    private findInactiveUsers(): void {
        const queryUsers = new Query()
        queryUsers.filters = { 'fitbit.status': 'valid_token' }

        // Finds all users with fitbit.status=valid_token.
        this._userAuthDataService
            .getAll(queryUsers)
            .then(async (usersData: Array<UserAuthData>) => {
                if (usersData.length) {
                    // Finds all devices of each user.
                    for (const user of usersData) {
                        const userId = user.user_id!

                        // Build query for devices.
                        const queryDevices = new Query()
                        queryDevices.ordination.set('last_sync', -1)
                        queryDevices.pagination.limit = Number.MAX_SAFE_INTEGER
                        queryDevices.addFilter({ user_id: userId })

                        const devices: Array<Device> = await this._deviceService.getAllByUser(userId, queryDevices)

                        // Goal 1.
                        if (!devices.length) {
                            // TODO GOAL 1
                            this._logger.info(`GOAL 1: The user with id: ${userId} has no active Fitbit devices.`)
                            break
                        }
                        // Goal 2.
                        else {
                            // TODO GOAL 2
                            const daysDiff = moment().diff(moment(devices[0].last_sync), 'days')
                            if (daysDiff >= this.daysInactive) {
                                this._logger.info(`GOAL 2: The user with id: ${userId} has no active Fitbit devices.`)

                                // Revoke User's Fitbit access
                                await this._userAuthDataService.revokeFitbitAccessToken(userId)
                            }
                        }
                    }
                }
            })
            .catch(err => {
                this._logger.error(`An error occurred while trying to retrieve data for Fitbit sync. ${err.message}`)
            })
    }
}
