import { EventType, IntegrationEvent } from './integration.event'

export class SleepSyncEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public sleep?: any | Array<any>) {
        super('SleepSyncEvent', EventType.ACTIVITY, timestamp)
    }

    public toJSON(): any {
        if (!this.sleep) return {}
        return {
            ...super.toJSON(),
            sleep: this.sleep instanceof Array ? this.sleep.map(item => item.toJSON()) : this.sleep.toJSON()
        }
    }
}
