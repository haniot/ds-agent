import { EventType, IntegrationEvent } from './integration.event'

export class PhysicalActivitySyncEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public activity?: any | Array<any>) {
        super('PhysicalActivitySyncEvent', EventType.ACTIVITY, timestamp)
    }

    public toJSON(): any {
        if (!this.activity) return {}
        return {
            ...super.toJSON(),
            physical_activity: this.activity instanceof Array ?
                this.activity.map(item => item.toJSON()) : this.activity.toJSON()
        }
    }
}
