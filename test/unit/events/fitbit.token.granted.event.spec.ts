import { assert } from 'chai'
import { Fitbit } from '../../../src/application/domain/model/fitbit'
import { FitbitTokenGrantedEvent } from '../../../src/application/integration-event/event/fitbit.token.granted.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { FitbitMock } from '../../mocks/models/fitbit.mock'

describe('EVENTS: FitbitTokenGrantedEvent', () => {
    describe('toJSON()', () => {
        context('when FitbitTokenGrantedEvent is complete', () => {
            it('should return a JSON from a complete FitbitTokenGrantedEvent', () => {
                const fitbit: Fitbit = new FitbitMock().generate(false, false, true)
                const timestamp: Date = new Date()
                const fitbitTokenGrantedEvent: FitbitTokenGrantedEvent = new FitbitTokenGrantedEvent(timestamp, fitbit)
                const result: any = fitbitTokenGrantedEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitTokenGrantedEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.deepPropertyVal(result, 'fitbit', fitbit.toJSON())
            })
        })

        context('when FitbitTokenGrantedEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a FitbitTokenGrantedEvent ' +
                'with an incomplete Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitTokenGrantedEvent: FitbitTokenGrantedEvent = new FitbitTokenGrantedEvent(timestamp, new Fitbit())
                const result: any = fitbitTokenGrantedEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitTokenGrantedEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.isUndefined(result.fitbit.user_id)
                assert.isUndefined(result.fitbit.last_sync)
                assert.isUndefined(result.fitbit.error)
                assert.isUndefined(result.fitbit.timestamp)
            })

            it('should return an empty JSON from a FitbitTokenGrantedEvent without Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitTokenGrantedEvent: FitbitTokenGrantedEvent = new FitbitTokenGrantedEvent(timestamp)
                const result: any = fitbitTokenGrantedEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
