import { assert } from 'chai'
import { Sleep } from '../../../src/application/domain/model/sleep'
import { SleepSyncEvent } from '../../../src/application/integration-event/event/sleep.sync.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { SleepMock } from '../../mocks/models/sleep.mock'

describe('EVENTS: SleepSyncEvent', () => {
    describe('toJSON()', () => {
        context('when SleepSyncEvent is complete', () => {
            it('should return a JSON from a complete SleepSyncEvent', () => {
                const sleep: Sleep = new SleepMock().generate()
                const timestamp: Date = new Date()
                const sleepSyncEvent: SleepSyncEvent =
                    new SleepSyncEvent(timestamp, sleep)
                const result: any = sleepSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', SleepSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.ACTIVITY)
                assert.deepPropertyVal(result, 'sleep', sleep.toJSON())
            })

            it('should return a JSON from an array of SleepSyncEvent objects', () => {
                const sleep: Sleep = new SleepMock().generate()
                const otherSleep: Sleep = new SleepMock().generate()
                const timestamp: Date = new Date()
                const sleepSyncEvent: SleepSyncEvent =
                    new SleepSyncEvent(timestamp, [sleep, otherSleep])
                const result: any = sleepSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', SleepSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.ACTIVITY)
                assert.deepEqual(result.sleep[0], sleep.toJSON())
                assert.deepEqual(result.sleep[1], otherSleep.toJSON())
            })
        })

        context('when SleepSyncEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from a SleepSyncEvent ' +
                'with an incomplete Sleep', () => {
                const timestamp: Date = new Date()
                const sleepSyncEvent: SleepSyncEvent =
                    new SleepSyncEvent(timestamp, new Sleep())
                const result: any = sleepSyncEvent.toJSON()

                assert.propertyVal(result, 'event_name', SleepSyncEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.ACTIVITY)
                assert.isUndefined(result.sleep.id)
                assert.isUndefined(result.sleep.start_time)
                assert.isUndefined(result.sleep.end_time)
                assert.isUndefined(result.sleep.duration)
                assert.isUndefined(result.sleep.user_id)
                assert.isUndefined(result.sleep.pattern)
                assert.isUndefined(result.sleep.type)
            })

            it('should return an empty JSON from a SleepSyncEvent without Sleep', () => {
                const timestamp: Date = new Date()
                const sleepSyncEvent: SleepSyncEvent = new SleepSyncEvent(timestamp)
                const result: any = sleepSyncEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
