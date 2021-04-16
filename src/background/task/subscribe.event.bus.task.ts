import { inject, injectable } from 'inversify'
import { IBackgroundTask } from '../../application/port/background.task.interface'
import { Identifier } from '../../di/identifiers'
import { UserDeleteEventHandler } from '../../application/integration-event/handler/user.delete.event.handler'
import { ILogger } from '../../utils/custom.logger'
import { IEventBus } from '../../infrastructure/port/event.bus.interface'
import { UserDeleteEvent } from '../../application/integration-event/event/user.delete.event'
import { DIContainer } from '../../di/di'

@injectable()
export class SubscribeEventBusTask implements IBackgroundTask {

    constructor(
        @inject(Identifier.RABBITMQ_EVENT_BUS) private readonly _eventBus: IEventBus,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
    }

    public run(): void {
        this.subscribeEvents()
    }

    public stop(): Promise<void> {
        return this._eventBus.dispose()
    }

    /**
     * Subscribe for all events.
     */
    private subscribeEvents(): void {
        try {
            this._eventBus
                .subscribe(
                    new UserDeleteEvent(new Date()),
                    new UserDeleteEventHandler(
                        DIContainer.get(Identifier.FITBIT_DATA_REPOSITORY),
                        DIContainer.get(Identifier.FITBIT_DEVICE_REPOSITORY),
                        DIContainer.get(Identifier.USER_AUTH_DATA_REPOSITORY),
                        DIContainer.get(Identifier.RESOURCE_REPOSITORY),
                        this._logger
                    ),
                    UserDeleteEvent.ROUTING_KEY
                ).then(res => {
                this._logger.info('Subscribe in UserDeleteEvent successful!')
            })
        } catch (err) {
            this._logger.error(`Error trying to get connection to Event Bus for event subscribe. ${err.message}`)
        }
    }
}
