import { assert } from 'chai'
import { User } from '../../../src/application/domain/model/user'
import { UserDeleteEvent } from '../../../src/application/integration-event/event/user.delete.event'
import { EventType } from '../../../src/application/integration-event/event/integration.event'
import { UserMock } from '../../mocks/models/user.mock'

describe('EVENTS: UserDeleteEvent', () => {
    describe('toJSON()', () => {
        context('when UserDeleteEvent is complete', () => {
            it('should return a JSON from a complete UserDeleteEvent', () => {
                const user: User = new UserMock().generate()
                const timestamp: Date = new Date()
                const userDeleteEvent: UserDeleteEvent = new UserDeleteEvent(timestamp, user)
                const result: any = userDeleteEvent.toJSON()

                assert.propertyVal(result, 'event_name', UserDeleteEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.USER)
                assert.deepPropertyVal(result, 'user', user.toJSON())
            })
        })

        context('when UserDeleteEvent is incomplete', () => {
            it('should return a JSON with some attributes equal to undefined from an UserDeleteEvent ' +
                'with an incomplete User', () => {
                const timestamp: Date = new Date()
                const userDeleteEvent: UserDeleteEvent = new UserDeleteEvent(timestamp, new User())
                const result: any = userDeleteEvent.toJSON()

                assert.propertyVal(result, 'event_name', UserDeleteEvent.NAME)
                assert.propertyVal(result, 'timestamp', timestamp)
                assert.propertyVal(result, 'type', EventType.USER)
                assert.isUndefined(result.user.id)
                assert.isUndefined(result.user.type)
            })

            it('should return an empty JSON from an UserDeleteEvent without User', () => {
                const timestamp: Date = new Date()
                const userDeleteEvent: UserDeleteEvent = new UserDeleteEvent(timestamp)
                const result: any = userDeleteEvent.toJSON()

                assert.isEmpty(result)
            })
        })
    })
})
