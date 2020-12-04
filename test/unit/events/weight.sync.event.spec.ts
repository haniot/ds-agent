import { assert } from 'chai'
import { Weight } from '../../../src/application/domain/model/weight'
import { WeightSyncEvent } from '../../../src/application/integration-event/event/weight.sync.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { WeightMock } from '../../mocks/models/weight.mock'
import { MeasurementType } from '../../../src/application/domain/model/measurement'

describe('EVENTS: WeightSyncEvent', () => {
    describe('toJSON()', () => {
        context('when WeightSyncEvent is complete', () => {
            it('should return a JSON from a complete WeightSyncEvent', () => {
                const weight: Weight = new WeightMock().generate()
                const timestamp: Date = new Date()
                const weightSyncEvent: WeightSyncEvent =
                    new WeightSyncEvent(timestamp, weight)
                const result: any = weightSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', WeightSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.MEASUREMENT)
                assert.deepPropertyVal(result, 'weight', weight.toJSON())
            })

            it('should return a JSON from an array of WeightSyncEvent objects', () => {
                const weight: Weight = new WeightMock().generate()
                const otherWeight: Weight = new WeightMock().generate()
                const timestamp: Date = new Date()
                const weightSyncEvent: WeightSyncEvent =
                    new WeightSyncEvent(timestamp, [weight, otherWeight])
                const result: any = weightSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', WeightSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.MEASUREMENT)
                assert.deepEqual(result.weight[0], weight.toJSON())
                assert.deepEqual(result.weight[1], otherWeight.toJSON())
            })
        })

        context('when WeightSyncEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a WeightSyncEvent ' +
                'with an incomplete Weight', () => {
                const timestamp: Date = new Date()
                const weightSyncEvent: WeightSyncEvent =
                    new WeightSyncEvent(timestamp, new Weight())
                const result: any = weightSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', WeightSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.MEASUREMENT)
                assert.isUndefined(result.weight.id)
                assert.propertyVal(result.weight, 'type', MeasurementType.WEIGHT)
                assert.isUndefined(result.weight.timestamp)
                assert.isUndefined(result.weight.value)
                assert.propertyVal(result.weight, 'unit', 'kg')
                assert.isUndefined(result.weight.user_id)
                assert.isUndefined(result.weight.body_fat)
            })

            it('should return an empty JSON from a WeightSyncEvent without Weight', () => {
                const timestamp: Date = new Date()
                const weightSyncEvent: WeightSyncEvent = new WeightSyncEvent(timestamp)
                const result: any = weightSyncEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
