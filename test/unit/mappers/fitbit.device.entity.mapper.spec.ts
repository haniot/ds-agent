import { assert } from 'chai'
import { FitbitDevice } from '../../../src/application/domain/model/fitbit.device'
import { FitbitDeviceEntityMapper } from '../../../src/infrastructure/entity/mapper/fitbit.device.entity.mapper'
import { FitbitDeviceEntity } from '../../../src/infrastructure/entity/fitbit.device.entity'
import { FitbitDeviceMock } from '../../mocks/models/fitbit.device.mock'
import { DefaultEntityMock } from '../../mocks/models/default.entity.mock'
import moment = require('moment')
import { ManufacturerType } from '../../../src/application/domain/utils/manufacturer.type'

describe('MAPPERS: FitbitDeviceEntityMapper', () => {
    const fitbitDeviceEntityMapper: FitbitDeviceEntityMapper = new FitbitDeviceEntityMapper()

    // Create FitbitDevice model.
    const fitbitDevice: FitbitDevice = new FitbitDeviceMock().generate()

    // Create FitbitDevice JSON.
    const fitbitDeviceRepoJSON: any = DefaultEntityMock.FITBIT_DEVICE
    const fitbitDeviceJSON: any = DefaultEntityMock.FITBIT_DEVICE_FITBIT_FORMAT

    describe('transform(item: any)', () => {
        context('when the parameter is of type FitbitDevice', () => {
            it('should return a FitbitDeviceEntity from a complete FitbitDevice', () => {
                const result: FitbitDeviceEntity = fitbitDeviceEntityMapper.transform(fitbitDevice)

                assert.propertyVal(result, 'id', fitbitDevice.id)
                assert.propertyVal(result, 'name', fitbitDevice.name)
                assert.propertyVal(result, 'address', fitbitDevice.address)
                assert.propertyVal(result, 'type', fitbitDevice.type)
                assert.propertyVal(result, 'last_sync', fitbitDevice.last_sync)
                assert.propertyVal(result, 'manufacturer', fitbitDevice.manufacturer)
                assert.propertyVal(result, 'user_id', fitbitDevice.user_id)
            })

            it('should return an empty FitbitDeviceEntity from empty FitbitDevice', () => {
                const emptyFitbitDevice: FitbitDevice = new FitbitDevice()
                emptyFitbitDevice.manufacturer = undefined
                const result: FitbitDeviceEntity = fitbitDeviceEntityMapper.transform(emptyFitbitDevice)

                assert.isEmpty(result)
            })
        })

        context('when the parameter is a JSON', () => {
            it('should return a FitbitDevice from a complete JSON (repo format)', () => {
                const result: FitbitDevice = fitbitDeviceEntityMapper.transform(fitbitDeviceRepoJSON)

                assert.propertyVal(result, 'id', fitbitDeviceRepoJSON.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
                assert.propertyVal(result, 'name', fitbitDeviceRepoJSON.name)
                assert.propertyVal(result, 'address', fitbitDeviceRepoJSON.address)
                assert.propertyVal(result, 'type', fitbitDeviceRepoJSON.type)
                assert.propertyVal(result, 'last_sync', fitbitDeviceRepoJSON.last_sync)
                assert.propertyVal(result, 'user_id', fitbitDeviceRepoJSON.user_id)
            })

            it('should return a FitbitDevice from a complete JSON (fitbit format)', () => {
                const result: FitbitDevice = fitbitDeviceEntityMapper.transform(fitbitDeviceJSON)

                assert.propertyVal(result, 'id', fitbitDeviceJSON.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
                assert.propertyVal(result, 'name', fitbitDeviceJSON.deviceVersion)
                assert.propertyVal(result, 'address', fitbitDeviceJSON.mac)
                assert.propertyVal(result, 'type', fitbitDeviceJSON.type)
                assert.propertyVal(result, 'last_sync',
                    moment(fitbitDeviceJSON.lastSyncTime).utc().format(`YYYY-MM-DDTHH:mm:ss.SSS[Z]`))
                assert.propertyVal(result, 'user_id', fitbitDeviceJSON.user_id)
            })

            it('should return a FitbitDevice with some attributes equal to undefined from an empty JSON', () => {
                const result: FitbitDevice = fitbitDeviceEntityMapper.transform({})

                assert.isUndefined(result.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
                assert.isUndefined(result.name)
                assert.isUndefined(result.address)
                assert.isUndefined(result.last_sync)
            })
        })

        context('when the parameter is undefined', () => {
            it('should return a FitbitDevice with some attributes equal to undefined from undefined json', () => {
                const result: FitbitDevice = fitbitDeviceEntityMapper.transform(undefined)

                assert.isUndefined(result.id)
                assert.propertyVal(result, 'manufacturer', ManufacturerType.FITBIT)
            })
        })
    })

    describe('modelEntityToModel()', () => {
        context('when try to use modelEntityToModel() function', () => {
            it('should throw an error', () => {
                try {
                    fitbitDeviceEntityMapper.modelEntityToModel(new FitbitDeviceEntity())
                } catch (err) {
                    assert.propertyVal(err, 'message', 'Not implemented.')
                }
            })
        })
    })
})
