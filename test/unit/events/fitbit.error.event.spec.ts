import { assert } from 'chai'
import { Fitbit } from '../../../src/application/domain/model/fitbit'
import { FitbitErrorEvent } from '../../../src/application/integration-event/event/fitbit.error.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { FitbitMock } from '../../mocks/models/fitbit.mock'

describe('EVENTS: FitbitErrorEvent', () => {
    describe('toJSON()', () => {
        context('when FitbitErrorEvent is complete', () => {
            it('should return a JSON from a complete FitbitErrorEvent', () => {
                const fitbit: Fitbit = new FitbitMock().generate(false, true, false)
                const timestamp: Date = new Date()
                const fitbitErrorEvent: FitbitErrorEvent = new FitbitErrorEvent(timestamp, fitbit)
                const result: any = fitbitErrorEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitErrorEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.deepPropertyVal(result, 'fitbit', fitbit.toJSON())
            })
        })

        context('when FitbitErrorEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a FitbitErrorEvent ' +
                'with an incomplete Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitErrorEvent: FitbitErrorEvent = new FitbitErrorEvent(timestamp, new Fitbit())
                const result: any = fitbitErrorEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitErrorEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.isUndefined(result.fitbit.user_id)
                assert.isUndefined(result.fitbit.last_sync)
                assert.isUndefined(result.fitbit.error)
                assert.isUndefined(result.fitbit.timestamp)
            })

            it('should return an empty JSON from a FitbitErrorEvent without Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitErrorEvent: FitbitErrorEvent = new FitbitErrorEvent(timestamp)
                const result: any = fitbitErrorEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
