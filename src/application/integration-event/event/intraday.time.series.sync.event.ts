import { EventType, IntegrationEvent } from './integration.event'

export class IntradayTimeSeriesSyncEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public patientId?: string, public timeSeries?: any) {
        super('IntradayTimeSeriesSyncEvent', EventType.TIME_SERIES, timestamp)
    }

    public toJSON(): any {
        if (!this.patientId || !this.timeSeries) return {}
        return {
            ...super.toJSON(),
            intraday: this.timeSeries.toJSON()
        }
    }
}
