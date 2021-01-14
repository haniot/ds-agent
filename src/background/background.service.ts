import { inject, injectable } from 'inversify'
import { Identifier } from '../di/identifiers'
import { IBackgroundTask } from '../application/port/background.task.interface'
import { IEventBus } from '../infrastructure/port/event.bus.interface'
import { IConnectionDB } from '../infrastructure/port/connection.db.interface'
import { ILogger } from '../utils/custom.logger'
import { Config } from '../utils/config'
import { InactiveUsersTask } from './task/inactive.users.task'
import { DIContainer } from '../di/di'
import { IUserAuthDataService } from '../application/port/user.auth.data.service.interface'
import { IFitbitDeviceService } from '../application/port/fitbit.device.service.interface'
import { Default } from '../utils/default'

@injectable()
export class BackgroundService {
    private _inactiveUsersTask: IBackgroundTask = new InactiveUsersTask(
        this._eventBus,
        DIContainer.get<IUserAuthDataService>(Identifier.USER_AUTH_DATA_SERVICE),
        DIContainer.get<IFitbitDeviceService>(Identifier.FITBIT_DEVICE_SERVICE),
        this._logger,
        Number(process.env.DAYS_INACTIVE_USERS) || Default.DAYS_INACTIVE_USERS,
        process.env.EXPRESSION_INACTIVE_USERS || Default.EXPRESSION_INACTIVE_USERS
    )

    constructor(
        @inject(Identifier.RABBITMQ_EVENT_BUS) private readonly _eventBus: IEventBus,
        @inject(Identifier.MONGODB_CONNECTION) private readonly _mongodb: IConnectionDB,
        @inject(Identifier.SUBSCRIBE_EVENT_BUS_TASK) private readonly _subscribeTask: IBackgroundTask,
        @inject(Identifier.SYNC_FITBIT_DATA_TASK) private readonly _syncFitbitDataTask: IBackgroundTask,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
    }

    public async startServices(): Promise<void> {
        try {
            /**
             * Trying to connect to mongodb.
             * Go ahead only when the run is resolved.
             * Since the application depends on the database connection to work.
             */
            const dbConfigs = Config.getMongoConfig()
            await this._mongodb.tryConnect(dbConfigs.uri, dbConfigs.options)

            // Open RabbitMQ connection and perform tasks
            this._startTasks()

        } catch (err) {
            return Promise.reject(new Error(`Error initializing services in background! ${err.message}`))
        }
    }

    public async stopServices(): Promise<void> {
        try {
            await this._mongodb.dispose()
            await this._eventBus.dispose()
            await this._subscribeTask.stop()
            await this._syncFitbitDataTask.stop()
            await this._inactiveUsersTask.stop()
        } catch (err) {
            return Promise.reject(new Error(`Error stopping MongoDB! ${err.message}`))
        }
    }

    /**
     * Open RabbitMQ connection and perform tasks
     */
    private _startTasks(): void {
        const rabbitConfigs = Config.getRabbitConfig()
        this._eventBus
            .connectionSub
            .open(rabbitConfigs.uri, rabbitConfigs.options)
            .then((conn) => {
                this._logger.info('Subscribe connection established!')

                conn.on('disconnected', () => this._logger.warn('Subscribe connection has been lost...'))
                conn.on('reestablished', () => this._logger.info('Subscribe connection re-established!'))

                this._subscribeTask.run()
            })
            .catch(err => {
                this._logger.error(`Error trying to get connection to Event Bus for event subscribing. ${err.message}`)
            })

        this._eventBus
            .connectionPub
            .open(rabbitConfigs.uri, rabbitConfigs.options)
            .then((conn) => {
                this._logger.info('Publish connection established!')

                conn.on('disconnected', () => this._logger.warn('Publish connection has been lost...'))
                conn.on('reestablished', () => this._logger.info('Publish connection re-established!'))
            })
            .catch(err => {
                this._logger.error(`Error trying to get connection to Event Bus for event publishing. ${err.message}`)
            })

        this._syncFitbitDataTask.run()

        this._inactiveUsersTask.run()
    }
}
