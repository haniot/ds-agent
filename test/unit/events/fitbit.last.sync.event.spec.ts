import { assert } from 'chai'
import { Fitbit } from '../../../src/application/domain/model/fitbit'
import { FitbitLastSyncEvent } from '../../../src/application/integration-event/event/fitbit.last.sync.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { FitbitMock } from '../../mocks/models/fitbit.mock'

describe('EVENTS: FitbitLastSyncEvent', () => {
    describe('toJSON()', () => {
        context('when FitbitLastSyncEvent is complete', () => {
            it('should return a JSON from a complete FitbitLastSyncEvent', () => {
                const fitbit: Fitbit = new FitbitMock().generate(true, false, false)
                const timestamp: Date = new Date()
                const fitbitLastSyncEvent: FitbitLastSyncEvent = new FitbitLastSyncEvent(timestamp, fitbit)
                const result: any = fitbitLastSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitLastSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.deepPropertyVal(result, 'fitbit', fitbit.toJSON())
            })
        })

        context('when FitbitLastSyncEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a FitbitLastSyncEvent ' +
                'with an incomplete Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitLastSyncEvent: FitbitLastSyncEvent = new FitbitLastSyncEvent(timestamp, new Fitbit())
                const result: any = fitbitLastSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitLastSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.isUndefined(result.fitbit.user_id)
                assert.isUndefined(result.fitbit.last_sync)
                assert.isUndefined(result.fitbit.error)
                assert.isUndefined(result.fitbit.timestamp)
            })

            it('should return an empty JSON from a FitbitLastSyncEvent without Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitLastSyncEvent: FitbitLastSyncEvent = new FitbitLastSyncEvent(timestamp)
                const result: any = fitbitLastSyncEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
