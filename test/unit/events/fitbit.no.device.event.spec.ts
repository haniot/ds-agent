import { assert } from 'chai'
import { Fitbit } from '../../../src/application/domain/model/fitbit'
import { FitbitNoDeviceEvent } from '../../../src/application/integration-event/event/fitbit.no.device.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { FitbitMock } from '../../mocks/models/fitbit.mock'

describe('EVENTS: FitbitNoDeviceEvent', () => {
    describe('toJSON()', () => {
        context('when FitbitNoDeviceEvent is complete', () => {
            it('should return a JSON from a complete FitbitNoDeviceEvent', () => {
                const fitbit: Fitbit = new FitbitMock().generate(false, false, false)
                const timestamp: Date = new Date()
                const fitbitNoDeviceEvent: FitbitNoDeviceEvent = new FitbitNoDeviceEvent(timestamp, fitbit)
                const result: any = fitbitNoDeviceEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitNoDeviceEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.deepPropertyVal(result, 'fitbit', fitbit.toJSON())
            })
        })

        context('when FitbitNoDeviceEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a FitbitNoDeviceEvent ' +
                'with an incomplete Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitNoDeviceEvent: FitbitNoDeviceEvent = new FitbitNoDeviceEvent(timestamp, new Fitbit())
                const result: any = fitbitNoDeviceEvent.toJSON()

                assert.propertyVal(result, 'event_name', FitbitNoDeviceEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.FITBIT)
                assert.isUndefined(result.fitbit.user_id)
                assert.isUndefined(result.fitbit.last_sync)
                assert.isUndefined(result.fitbit.error)
                assert.isUndefined(result.fitbit.timestamp)
            })

            it('should return an empty JSON from a FitbitNoDeviceEvent without Fitbit', () => {
                const timestamp: Date = new Date()
                const fitbitNoDeviceEvent: FitbitNoDeviceEvent = new FitbitNoDeviceEvent(timestamp)
                const result: any = fitbitNoDeviceEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
