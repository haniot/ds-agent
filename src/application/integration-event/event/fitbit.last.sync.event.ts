import { EventType, IntegrationEvent } from './integration.event'

export class FitbitLastSyncEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public message?: any) {
        super('FitbitLastSyncEvent', EventType.FITBIT, timestamp)
    }

    public toJSON(): any {
        if (!this.message) return {}
        return {
            ...super.toJSON(),
            fitbit: this.message
        }
    }
}
