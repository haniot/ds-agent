import { EventType, IntegrationEvent } from './integration.event'
import { Fitbit } from '../../domain/model/fitbit'

export class FitbitTokenGrantedEvent extends IntegrationEvent<Fitbit> {
    public static readonly ROUTING_KEY: string = 'fitbit.token-granted'
    public static readonly NAME: string = 'FitbitTokenGrantedEvent'

    constructor(public timestamp?: Date, public fitbit?: Fitbit) {
        super(FitbitTokenGrantedEvent.NAME, EventType.FITBIT, timestamp)
    }

    public toJSON(): any {
        if (!this.fitbit) return {}
        return {
            ...super.toJSON(),
            fitbit: { ...this.fitbit.toJSON() }
        }
    }
}
