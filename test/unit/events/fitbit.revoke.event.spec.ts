import { assert } from 'chai'
import { Fitbit } from '../../../src/application/domain/model/fitbit'
import { FitbitRevokeEvent } from '../../../src/application/integration-event/event/fitbit.revoke.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { FitbitMock } from '../../mocks/models/fitbit.mock'

describe('EVENTS: FitbitRevokeEvent', () => {
    describe('toJSON()', () => {
        context('when FitbitRevokeEvent is complete', () => {
            it('should return a JSON from a complete FitbitRevokeEvent', () => {
                const fitbit: Fitbit = new FitbitMock().generate(false, false, true)
                const timestamp: Date = new Date()
                const fitbitRevokeEvent: FitbitRevokeEvent = new FitbitRevokeEvent(timestamp, fitbit)
                const result: any = fitbitRevokeEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitRevokeEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.deepPropertyVal(result, 'fitbit', fitbit.toJSON())
            })
        })

        context('when FitbitRevokeEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a FitbitRevokeEvent ' +
                'with an incomplete Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitRevokeEvent: FitbitRevokeEvent = new FitbitRevokeEvent(timestamp, new Fitbit())
                const result: any = fitbitRevokeEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitRevokeEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.isUndefined(result.fitbit.user_id)
                assert.isUndefined(result.fitbit.last_sync)
                assert.isUndefined(result.fitbit.error)
                assert.isUndefined(result.fitbit.timestamp)
            })

            it('should return an empty JSON from a FitbitRevokeEvent without Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitRevokeEvent: FitbitRevokeEvent = new FitbitRevokeEvent(timestamp)
                const result: any = fitbitRevokeEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
