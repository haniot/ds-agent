import { inject, injectable } from 'inversify'
import { Identifier } from '../di/identifiers'
import { Default } from '../utils/default'
import { IBackgroundTask } from '../application/port/background.task.interface'
import { IEventBus } from '../infrastructure/port/event.bus.interface'
import { IConnectionDB } from '../infrastructure/port/connection.db.interface'
import fs from 'fs'
import { ILogger } from '../utils/custom.logger'

@injectable()
export class BackgroundService {

    constructor(
        @inject(Identifier.MONGODB_CONNECTION) private readonly _mongodb: IConnectionDB,
        @inject(Identifier.RABBITMQ_EVENT_BUS) private readonly _eventBus: IEventBus,
        @inject(Identifier.SUBSCRIBE_EVENT_BUS_TASK) private readonly _subscribeTask: IBackgroundTask,
        @inject(Identifier.COLLECT_FITBIT_USER_DATA_TASK) private readonly _collectTask: IBackgroundTask,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
    }

    public async startServices(): Promise<void> {
        try {
            // Trying to connect to mongodb.
            // Go ahead only when the run is resolved.
            // Since the application depends on the database connection to work.
            await this._mongodb.tryConnect(this.getDBUri())

            // Opening the publish connection
            const rabbitUri = process.env.RABBITMQ_URI || Default.RABBITMQ_URI
            const rabbitOptions: any = { sslOptions: { ca: [] } }
            if (rabbitUri.indexOf('amqps') === 0) {
                rabbitOptions.sslOptions.ca = [fs.readFileSync(process.env.RABBITMQ_CA_PATH || Default.RABBITMQ_CA_PATH)]
            }

            this._eventBus.connectionPub
                .open(rabbitUri, rabbitOptions)
                .then(() => {
                    this._logger.info('Connection with publisher event opened successful!')
                })
                .catch(err => {
                    this._logger.error(`Error trying to get connection to Event Bus for event publishing. ${err.message}`)
                })

            // Provide all resources
            this._subscribeTask.run()
            this._collectTask.run()
        } catch (err) {
            return Promise.reject(new Error(`Error initializing services in background! ${err.message}`))
        }
    }

    public async stopServices(): Promise<void> {
        try {
            await this._mongodb.dispose()
            await this._eventBus.dispose()
            await this._subscribeTask.stop()
        } catch (err) {
            return Promise.reject(new Error(`Error stopping MongoDB! ${err.message}`))
        }
    }

    /**
     * Retrieve the URI for connection to ConnectionMongodb.
     *
     * @return {string}
     */
    private getDBUri(): string {
        if (process.env.NODE_ENV && process.env.NODE_ENV === 'test') {
            return process.env.MONGODB_URI_TEST || Default.MONGODB_URI_TEST
        }
        return process.env.MONGODB_URI || Default.MONGODB_URI
    }
}
