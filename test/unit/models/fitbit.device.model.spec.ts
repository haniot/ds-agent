import { DefaultEntityMock } from '../../mocks/models/default.entity.mock'
import { assert } from 'chai'
import { FitbitDevice } from '../../../src/application/domain/model/fitbit.device'
import { ManufacturerType } from '../../../src/application/domain/utils/manufacturer.type'

describe('MODELS: FitbitDevice', () => {
    const fitbitDeviceJSON: any = JSON.parse(JSON.stringify(DefaultEntityMock.FITBIT_DEVICE))

    describe('fromJSON()', () => {
        context('when a json is passed', () => {
            it('should return a FitbitDevice from a complete json', () => {
                const result: FitbitDevice = new FitbitDevice().fromJSON(fitbitDeviceJSON)

                assert.propertyVal(result, 'id', fitbitDeviceJSON.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
                assert.propertyVal(result, 'name', fitbitDeviceJSON.name)
                assert.propertyVal(result, 'address', fitbitDeviceJSON.address)
                assert.propertyVal(result, 'type', fitbitDeviceJSON.type)
                assert.propertyVal(result, 'last_sync', fitbitDeviceJSON.last_sync)
            })

            it('should return a FitbitDevice with some undefined parameters from an empty json', () => {
                const result: FitbitDevice = new FitbitDevice().fromJSON({})

                assert.isUndefined(result.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
            })
        })

        context('when the parameter is undefined', () => {
            it('should return a FitbitDevice with some undefined parameters from an undefined json', () => {
                const result: FitbitDevice = new FitbitDevice().fromJSON(undefined)

                assert.isUndefined(result.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
            })
        })

        context('when the json is a string', () => {
            it('should return a FitbitDevice from a complete json', () => {
                const result: FitbitDevice = new FitbitDevice().fromJSON(JSON.stringify(fitbitDeviceJSON))

                assert.propertyVal(result, 'id', fitbitDeviceJSON.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
                assert.propertyVal(result, 'name', fitbitDeviceJSON.name)
                assert.propertyVal(result, 'address', fitbitDeviceJSON.address)
                assert.propertyVal(result, 'type', fitbitDeviceJSON.type)
                assert.propertyVal(result, 'last_sync', fitbitDeviceJSON.last_sync)
            })

            it('should return a FitbitDevice with some undefined parameters from an empty string', () => {
                const result: FitbitDevice = new FitbitDevice().fromJSON(JSON.stringify(''))

                assert.isUndefined(result.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
            })

            it('should return a FitbitDevice with some undefined parameters from an invalid string', () => {
                const result: FitbitDevice = new FitbitDevice().fromJSON('d52215d412')

                assert.isUndefined(result.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
            })
        })
    })

    describe('toJSON()', () => {
        context('when toJSON() is executed', () => {
            it('should return a JSON from a complete FitbitDevice', () => {
                const fitbitDevice: FitbitDevice = new FitbitDevice().fromJSON(fitbitDeviceJSON)
                fitbitDevice.user_id = fitbitDeviceJSON.user_id
                const result: any = fitbitDevice.toJSON()

                assert.propertyVal(result, 'id', fitbitDeviceJSON.id)
                assert.propertyVal(result, 'name', fitbitDeviceJSON.name)
                assert.propertyVal(result, 'address', fitbitDeviceJSON.address)
                assert.propertyVal(result, 'type', fitbitDeviceJSON.type)
                assert.propertyVal(result, 'last_sync', fitbitDeviceJSON.last_sync)
                assert.propertyVal(result, 'user_id', fitbitDeviceJSON.user_id)
            })

            it('should return a JSON with all attributes equal to undefined from an incomplete FitbitDevice', () => {
                const result: any = new FitbitDevice().toJSON()

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
