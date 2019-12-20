import { EventType, IntegrationEvent } from './integration.event'

export class TimeSeriesSyncEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public patientId?: string, public timeSeries?: any) {
        super('TimeSeriesSyncEvent', EventType.TIME_SERIES, timestamp)
    }

    public toJSON(): any {
        if (!this.patientId || !this.timeSeries) return {}
        return {
            ...super.toJSON(),
            timeseries: this.timeSeries.toJSON()
        }
    }
}
