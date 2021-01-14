import { assert } from 'chai'
import { PhysicalActivity } from '../../../src/application/domain/model/physical.activity'
import { PhysicalActivitySyncEvent } from '../../../src/application/integration-event/event/physical.activity.sync.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { PhysicalActivityMock } from '../../mocks/models/physical.activity.mock'

describe('EVENTS: PhysicalActivitySyncEvent', () => {
    describe('toJSON()', () => {
        context('when PhysicalActivitySyncEvent is complete', () => {
            it('should return a JSON from a complete PhysicalActivitySyncEvent', () => {
                const physicalActivity: PhysicalActivity = new PhysicalActivityMock().generate()
                const timestamp: Date = new Date()
                const physicalActivitySyncEvent: PhysicalActivitySyncEvent =
                    new PhysicalActivitySyncEvent(timestamp, physicalActivity)
                const result: any = physicalActivitySyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', PhysicalActivitySyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.ACTIVITY)
                assert.deepPropertyVal(result, 'physical_activity', physicalActivity.toJSON())
            })

            it('should return a JSON from an array of PhysicalActivitySyncEvent objects', () => {
                const physicalActivity: PhysicalActivity = new PhysicalActivityMock().generate()
                const otherPhysicalActivity: PhysicalActivity = new PhysicalActivityMock().generate()
                const timestamp: Date = new Date()
                const physicalActivitySyncEvent: PhysicalActivitySyncEvent =
                    new PhysicalActivitySyncEvent(timestamp, [physicalActivity, otherPhysicalActivity])
                const result: any = physicalActivitySyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', PhysicalActivitySyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.ACTIVITY)
                assert.deepEqual(result.physical_activity[0], physicalActivity.toJSON())
                assert.deepEqual(result.physical_activity[1], otherPhysicalActivity.toJSON())
            })
        })

        context('when PhysicalActivitySyncEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a PhysicalActivitySyncEvent ' +
                'with an incomplete PhysicalActivity', () => {
                const timestamp: Date = new Date()
                const physicalActivitySyncEvent: PhysicalActivitySyncEvent =
                    new PhysicalActivitySyncEvent(timestamp, new PhysicalActivity())
                const result: any = physicalActivitySyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', PhysicalActivitySyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.ACTIVITY)
                assert.isUndefined(result.physical_activity.id)
                assert.isUndefined(result.physical_activity.start_time)
                assert.isUndefined(result.physical_activity.end_time)
                assert.isUndefined(result.physical_activity.duration)
                assert.isUndefined(result.physical_activity.user_id)
                assert.isUndefined(result.physical_activity.name)
                assert.isUndefined(result.physical_activity.calories)
                assert.isUndefined(result.physical_activity.steps)
                assert.isUndefined(result.physical_activity.distance)
                assert.isUndefined(result.physical_activity.levels)
                assert.isUndefined(result.physical_activity.heart_rate_zones)
                assert.isUndefined(result.physical_activity.heart_rate_average)
            })

            it('should return an empty JSON from a PhysicalActivitySyncEvent without PhysicalActivity', () => {
                const timestamp: Date = new Date()
                const physicalActivitySyncEvent: PhysicalActivitySyncEvent = new PhysicalActivitySyncEvent(timestamp)
                const result: any = physicalActivitySyncEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
