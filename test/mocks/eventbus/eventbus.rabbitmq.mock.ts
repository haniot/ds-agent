import { IIntegrationEventHandler } from '../../../src/application/integration-event/handler/integration.event.handler.interface'
import { IntegrationEvent } from '../../../src/application/integration-event/event/integration.event'
import { IEventBusOptions } from '../../../src/infrastructure/port/connection.factory.interface'
import qs from 'query-strings-parser'
import { DefaultEntityMock } from '../models/default.entity.mock'
import { IEventBus } from '../../../src/infrastructure/port/event.bus.interface'
import { IDisposable } from '../../../src/infrastructure/port/disposable.interface'
import { IConnectionEventBus } from '../../../src/infrastructure/port/connection.event.bus.interface'
import { IQuery } from '../../../src/application/port/query.interface'

export class EventBusRabbitMQMock implements IEventBus, IDisposable {
    private readonly _bus!: any
    public readonly connectionPub: IConnectionEventBus = undefined!
    public connectionRpcClient: IConnectionEventBus = undefined!
    public connectionRpcServer: IConnectionEventBus = undefined!
    public connectionSub: IConnectionEventBus = undefined!

    constructor() {
        this._bus = {
            getChildren: (query: string): Promise<any> => {
                const filters: any = qs.parser(query).filters
                if (filters._id === 'error') return Promise.reject({ message: 'An error occurs!' })
                return Promise.resolve(filters._id && filters._id === DefaultEntityMock.USER_IDS.user_id ?
                    [DefaultEntityMock.CHILD] : [])
            },
            pubFitbitLastSync: (object: any): Promise<any> => {
                if (object.last_sync === 'error') return Promise.reject({ message: 'An error occurs!' })
                return Promise.resolve()
            },
            pubFitbitAuthError: (err: any, userId: string): Promise<any> => {
                if (userId === 'error') return Promise.reject({ message: 'An error occurs!' })
                return Promise.resolve()
            },
            pubSaveWeight: (resource: any): Promise<any> => {
                return Promise.resolve()
            },
            pubFitbitRevoke: (resource: any): Promise<any> => {
                return Promise.resolve()
            }
        }
    }

    get bus(): any {
        return this._bus
    }

    public dispose(): Promise<void> {
        return Promise.resolve()
    }

    public subscribe(
        event: IntegrationEvent<any>,
        handler: IIntegrationEventHandler<IntegrationEvent<any>>,
        routingKey: string): Promise<boolean> {
        return Promise.resolve(true)
    }

    public initialize(uri: string, options?: IEventBusOptions): Promise<void> {
        return Promise.resolve()
    }

    public enableLogger(): void {
        return
    }

    public executeResource(resourceName: string, query?: string | IQuery): Promise<any> {
        return Promise.resolve()
    }

    public provideResource(name: string, listener: (...any) => any): Promise<boolean> {
        return Promise.resolve(true)
    }

    public publish(event: IntegrationEvent<any>, routingKey: string): Promise<boolean> {
        return Promise.resolve(true)
    }

}
