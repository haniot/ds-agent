import { EventType, IntegrationEvent } from './integration.event'
import { PhysicalActivity } from '../../domain/model/physical.activity'

export class PhysicalActivitySyncEvent extends IntegrationEvent<any> {
    public static readonly ROUTING_KEY: string = 'physicalactivities.sync'
    public static readonly NAME: string = 'PhysicalActivitySyncEvent'

    constructor(public timestamp?: Date, public activity?: PhysicalActivity | Array<PhysicalActivity>) {
        super(PhysicalActivitySyncEvent.NAME, EventType.ACTIVITY, timestamp)
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
