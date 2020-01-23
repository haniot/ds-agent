import { EventType, IntegrationEvent } from './integration.event'

export class FitbitErrorEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public error?: any) {
        super('FitbitErrorEvent', EventType.FITBIT, timestamp)
    }

    public toJSON(): any {
        if (!this.error) return {}
        return {
            ...super.toJSON(),
            fitbit: this.error
        }
    }
}
