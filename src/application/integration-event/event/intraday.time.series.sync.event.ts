import { EventType, IntegrationEvent } from './integration.event'
import { UserIntradayTimeSeries } from '../../domain/model/user.intraday.time.series'

export class IntradayTimeSeriesSyncEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public patientId?: string, public timeSeries?: UserIntradayTimeSeries) {
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
