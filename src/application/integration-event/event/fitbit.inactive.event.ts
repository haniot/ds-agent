import { EventType, IntegrationEvent } from './integration.event'
import { Fitbit } from '../../domain/model/fitbit'

export class FitbitInactiveEvent extends IntegrationEvent<Fitbit> {
    public static readonly ROUTING_KEY: string = 'fitbit.inactive'
    public static readonly NAME: string = 'FitbitInactiveEvent'

    constructor(public timestamp?: Date, public fitbit?: Fitbit) {
        super(FitbitInactiveEvent.NAME, EventType.FITBIT, timestamp)
    }

    public toJSON(): any {
        if (!this.fitbit) return {}
        return {
            ...super.toJSON(),
            fitbit: this.fitbit.toJSON()
        }
    }
}
