import { DefaultEntityMock } from '../../mocks/models/default.entity.mock'
import { assert } from 'chai'
import { Device } from '../../../src/application/domain/model/device'

describe('MODELS: Device', () => {
    const deviceJSON: any = JSON.parse(JSON.stringify(DefaultEntityMock.DEVICE))

    describe('fromJSON()', () => {
        context('when a json is passed', () => {
            it('should return a Device from a complete json', () => {
                const result: Device = new Device().fromJSON(deviceJSON)

                assert.propertyVal(result, 'id', deviceJSON.id)
                assert.propertyVal(result, 'name', deviceJSON.name)
                assert.propertyVal(result, 'address', deviceJSON.address)
                assert.propertyVal(result, 'type', deviceJSON.type)
                assert.propertyVal(result, 'last_sync', deviceJSON.last_sync)
            })

            it('should return a Device with some undefined parameters from an empty json', () => {
                const result: Device = new Device().fromJSON({})

                assert.isUndefined(result.id)
            })
        })

        context('when the parameter is undefined', () => {
            it('should return a Device with some undefined parameters from an undefined json', () => {
                const result: Device = new Device().fromJSON(undefined)

                assert.isUndefined(result.id)
            })
        })

        context('when the json is a string', () => {
            it('should return a Device from a complete json', () => {
                const result: Device = new Device().fromJSON(JSON.stringify(deviceJSON))

                assert.propertyVal(result, 'id', deviceJSON.id)
                assert.propertyVal(result, 'name', deviceJSON.name)
                assert.propertyVal(result, 'address', deviceJSON.address)
                assert.propertyVal(result, 'type', deviceJSON.type)
                assert.propertyVal(result, 'last_sync', deviceJSON.last_sync)
            })

            it('should return a Device with some undefined parameters from an empty string', () => {
                const result: Device = new Device().fromJSON(JSON.stringify(''))

                assert.isUndefined(result.id)
            })

            it('should return a Device with some undefined parameters from an invalid string', () => {
                const result: Device = new Device().fromJSON('d52215d412')

                assert.isUndefined(result.id)
            })
        })
    })

    describe('toJSON()', () => {
        context('when toJSON() is executed', () => {
            it('should return a JSON from a complete Device', () => {
                const device: Device = new Device().fromJSON(deviceJSON)
                device.user_id = deviceJSON.user_id
                const result: any = device.toJSON()

                assert.propertyVal(result, 'id', deviceJSON.id)
                assert.propertyVal(result, 'name', deviceJSON.name)
                assert.propertyVal(result, 'address', deviceJSON.address)
                assert.propertyVal(result, 'type', deviceJSON.type)
                assert.propertyVal(result, 'last_sync', deviceJSON.last_sync)
                assert.propertyVal(result, 'user_id', deviceJSON.user_id)
            })

            it('should return a JSON with all attributes equal to undefined from an incomplete Device', () => {
                const result: any = new Device().toJSON()

                assert.isUndefined(result.id)
                assert.isUndefined(result.name)
                assert.isUndefined(result.address)
                assert.isUndefined(result.type)
                assert.isUndefined(result.last_sync)
                assert.isUndefined(result.user_id)
            })
        })
    })
})
