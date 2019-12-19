import { EventType, IntegrationEvent } from './integration.event'

export class WeightSyncEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public weight?: any | Array<any>) {
        super('WeightSyncEvent', EventType.MEASUREMENT, timestamp)
    }

    public toJSON(): any {
        if (!this.weight) return {}
        return {
            ...super.toJSON(),
            weight: this.weight instanceof Array ? this.weight.map(item => item.toJSON()) : this.weight.toJSON()
        }
    }
}
