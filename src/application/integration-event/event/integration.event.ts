import { IJSONSerializable } from '../../domain/utils/json.serializable.interface'

export abstract class IntegrationEvent<T> implements IJSONSerializable {

    protected constructor(readonly event_name: string, readonly type: string, readonly timestamp?: Date) {
    }

    public toJSON(): any {
        return {
            event_name: this.event_name,
            timestamp: this.timestamp,
            type: this.type
        }
    }
}

export enum EventType {
    USER = 'users',
    ACTIVITY = 'activities',
    MEASUREMENT = 'measurements',
    TIME_SERIES = 'timeseries',
    FITBIT = 'fitbit'
}
