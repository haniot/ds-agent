import { EventType, IntegrationEvent } from './integration.event'
import { Fitbit } from '../../domain/model/fitbit'

export class FitbitErrorEvent extends IntegrationEvent<Fitbit> {
    public static readonly ROUTING_KEY: string = 'fitbit.error'
    public static readonly NAME: string = 'FitbitErrorEvent'

    constructor(public timestamp?: Date, public fitbit?: Fitbit) {
        super(FitbitErrorEvent.NAME, EventType.FITBIT, timestamp)
    }

    public toJSON(): any {
        if (!this.fitbit) return {}
        return {
            ...super.toJSON(),
            fitbit: this.fitbit.toJSON()
        }
    }
}
