import { EventType, IntegrationEvent } from './integration.event'
import { UserIntradayTimeSeries } from '../../domain/model/user.intraday.time.series'

export class IntradayTimeSeriesSyncEvent extends IntegrationEvent<any> {
    public static readonly ROUTING_KEY: string = 'intraday.sync'
    public static readonly NAME: string = 'IntradayTimeSeriesSyncEvent'

    constructor(public timestamp?: Date, public userId?: string, public timeSeries?: UserIntradayTimeSeries) {
        super(IntradayTimeSeriesSyncEvent.NAME, EventType.TIME_SERIES, timestamp)
    }

    public toJSON(): any {
        if (!this.userId || !this.timeSeries) return {}
        return {
            ...super.toJSON(),
            intraday: this.timeSeries.toJSON()
        }
    }
}
