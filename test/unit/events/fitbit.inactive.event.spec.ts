import { assert } from 'chai'
import { Fitbit } from '../../../src/application/domain/model/fitbit'
import { FitbitInactiveEvent } from '../../../src/application/integration-event/event/fitbit.inactive.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { FitbitMock } from '../../mocks/models/fitbit.mock'

describe('EVENTS: FitbitInactiveEvent', () => {
    describe('toJSON()', () => {
        context('when FitbitInactiveEvent is complete', () => {
            it('should return a JSON from a complete FitbitInactiveEvent', () => {
                const fitbit: Fitbit = new FitbitMock().generate(false, false, false)
                const timestamp: Date = new Date()
                const fitbitInactiveEvent: FitbitInactiveEvent = new FitbitInactiveEvent(timestamp, fitbit)
                const result: any = fitbitInactiveEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitInactiveEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.deepPropertyVal(result, 'fitbit', fitbit.toJSON())
            })
        })

        context('when FitbitInactiveEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a FitbitInactiveEvent ' +
                'with an incomplete Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitInactiveEvent: FitbitInactiveEvent = new FitbitInactiveEvent(timestamp, new Fitbit())
                const result: any = fitbitInactiveEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitInactiveEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.isUndefined(result.fitbit.user_id)
                assert.isUndefined(result.fitbit.last_sync)
                assert.isUndefined(result.fitbit.error)
                assert.isUndefined(result.fitbit.timestamp)
            })

            it('should return an empty JSON from a FitbitInactiveEvent without Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitInactiveEvent: FitbitInactiveEvent = new FitbitInactiveEvent(timestamp)
                const result: any = fitbitInactiveEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
