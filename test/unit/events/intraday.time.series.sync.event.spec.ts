import { assert } from 'chai'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { UserIntradayTimeSeries } from '../../../src/application/domain/model/user.intraday.time.series'
import { UserIntradayTimeSeriesMock } from '../../mocks/models/user.intraday.time.series.mock'
import { IntradayTimeSeriesSyncEvent } from '../../../src/application/integration-event/event/intraday.time.series.sync.event'
import { DefaultFunctions } from '../../mocks/utils/default.functions'

describe('EVENTS: IntradayTimeSeriesSyncEvent', () => {
    describe('toJSON()', () => {
        context('when IntradayTimeSeriesSyncEvent is complete', () => {
            it('should return a JSON from a complete IntradayTimeSeriesSyncEvent', () => {
                const userIntradayTimeSeries: UserIntradayTimeSeries = new UserIntradayTimeSeriesMock().generate('heart_rate')
                const timestamp: Date = new Date()
                const intradayTimeSeriesSyncEvent: IntradayTimeSeriesSyncEvent =
                    new IntradayTimeSeriesSyncEvent(timestamp, userIntradayTimeSeries.user_id, userIntradayTimeSeries)
                const result: any = intradayTimeSeriesSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', IntradayTimeSeriesSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.TIME_SERIES)
                assert.deepPropertyVal(result, 'intraday', userIntradayTimeSeries.toJSON())
            })
        })

        context('when IntradayTimeSeriesSyncEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a IntradayTimeSeriesSyncEvent ' +
                'with an incomplete UserIntradayTimeSeries', () => {
                const timestamp: Date = new Date()
                const intradayTimeSeriesSyncEvent: IntradayTimeSeriesSyncEvent =
                    new IntradayTimeSeriesSyncEvent(timestamp, DefaultFunctions.generateObjectId(), new UserIntradayTimeSeries())
                const result: any = intradayTimeSeriesSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', IntradayTimeSeriesSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.TIME_SERIES)
                assert.isUndefined(result.intraday.user_id)
                assert.isUndefined(result.intraday.start_time)
                assert.isUndefined(result.intraday.end_time)
                assert.isUndefined(result.intraday.interval)
                assert.isUndefined(result.intraday.type)
                assert.isUndefined(result.intraday.zones)
                assert.isEmpty(result.intraday.data_set)
            })

            it('should return an empty JSON from a IntradayTimeSeriesSyncEvent without user id', () => {
                const timestamp: Date = new Date()
                const intradayTimeSeriesSyncEvent: IntradayTimeSeriesSyncEvent =
                    new IntradayTimeSeriesSyncEvent(timestamp, '', new UserIntradayTimeSeriesMock().generate('steps'))
                const result: any = intradayTimeSeriesSyncEvent.toJSON()

                assert.isEmpty(result)
            })

            it('should return an empty JSON from a IntradayTimeSeriesSyncEvent without UserIntradayTimeSeries', () => {
                const timestamp: Date = new Date()
                const intradayTimeSeriesSyncEvent: IntradayTimeSeriesSyncEvent =
                    new IntradayTimeSeriesSyncEvent(timestamp, DefaultFunctions.generateObjectId())
                const result: any = intradayTimeSeriesSyncEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
