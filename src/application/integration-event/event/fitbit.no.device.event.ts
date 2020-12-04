import { EventType, IntegrationEvent } from './integration.event'
import { Fitbit } from '../../domain/model/fitbit'

export class FitbitNoDeviceEvent extends IntegrationEvent<Fitbit> {
    public static readonly ROUTING_KEY: string = 'fitbit.nodevice'
    public static readonly NAME: string = 'FitbitNoDeviceEvent'

    constructor(public timestamp?: Date, public fitbit?: Fitbit) {
        super(FitbitNoDeviceEvent.NAME, EventType.FITBIT, timestamp)
    }

    public toJSON(): any {
        if (!this.fitbit) return {}
        return {
            ...super.toJSON(),
            fitbit: this.fitbit.toJSON()
        }
    }
}
