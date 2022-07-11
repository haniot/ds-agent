import { inject, injectable } from 'inversify'
import qs from 'query-strings-parser'
import { FitbitDevice } from '../../application/domain/model/fitbit.device'
import { IBackgroundTask } from '../../application/port/background.task.interface'
import { IFitbitDeviceRepository } from '../../application/port/fitbit.device.repository.interface'
import { IQuery } from '../../application/port/query.interface'
import { Identifier } from '../../di/identifiers'
import { IEventBus } from '../../infrastructure/port/event.bus.interface'
import { Query } from '../../infrastructure/repository/query/query'
import { ILogger } from '../../utils/custom.logger'

@injectable()
export class RpcServerEventBusTask implements IBackgroundTask {
    constructor(
        @inject(Identifier.RABBITMQ_EVENT_BUS) private readonly _eventBus: IEventBus,
        @inject(Identifier.FITBIT_DEVICE_REPOSITORY) private readonly _fitbitDeviceRepo: IFitbitDeviceRepository,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
    }

    public run(): void {
        this.initializeServer()
    }

    public async stop(): Promise<void> {
        try {
            await this._eventBus.dispose()
        } catch (err: any) {
            return Promise.reject(new Error(`Error stopping RPC Server! ${err.message}`))
        }
    }

    private initializeServer(): void {
        // Providing fitbitdevices.find.
        this._eventBus
            .provideResource('fitbitdevices.find', async (_query?: string) => {
                try {
                    const query: IQuery = this.buildQS(_query)
                    const fitbitDevices: Array<FitbitDevice> = await this._fitbitDeviceRepo.find(query)
                    return fitbitDevices.map(item => item.toJSON())
                } catch (err) {
                    return err
                }
            })
            .then(() => this._logger.info('Resource fitbitdevices.find successful registered'))
            .catch((err) => this._logger.error(`Error at register resource fitbitdevices.find: ${err.message}`))
    }

    /**
     * Prepare query string based on defaults parameters and values.
     *
     * @param query
     */
    private buildQS(query?: any): IQuery {
        return new Query().fromJSON(
            qs.parser(query ? query : {}, { pagination: { limit: Number.MAX_SAFE_INTEGER } },
                { use_page: true })
        )
    }
}
