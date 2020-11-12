import { assert } from 'chai'
import { Device } from '../../../src/application/domain/model/device'
import { DeviceEntityMapper } from '../../../src/infrastructure/entity/mapper/device.entity.mapper'
import { DeviceEntity } from '../../../src/infrastructure/entity/device.entity'
import { DeviceMock } from '../../mocks/models/device.mock'
import { DefaultEntityMock } from '../../mocks/models/default.entity.mock'
import moment from 'moment'

describe('MAPPERS: DeviceEntityMapper', () => {
    const deviceEntityMapper: DeviceEntityMapper = new DeviceEntityMapper()

    // Create Device model.
    const device: Device = new DeviceMock().generate()

    // Create Device JSON.
    const deviceRepoJSON: any = DefaultEntityMock.DEVICE
    const deviceFitbitJSON: any = DefaultEntityMock.DEVICE_FITBIT

    describe('transform(item: any)', () => {
        context('when the parameter is of type Device', () => {
            it('should return a DeviceEntity from a complete Device', () => {
                const result: DeviceEntity = deviceEntityMapper.transform(device)

                assert.propertyVal(result, 'id', device.id)
                assert.propertyVal(result, 'name', device.name)
                assert.propertyVal(result, 'address', device.address)
                assert.propertyVal(result, 'type', device.type)
                assert.propertyVal(result, 'last_sync', device.last_sync)
                assert.propertyVal(result, 'patient_id', device.patient_id)
            })

            it('should return an empty DeviceEntity from empty Device', () => {
                const result: DeviceEntity = deviceEntityMapper.transform(new Device())

                assert.isEmpty(result)
            })
        })

        context('when the parameter is a JSON', () => {
            it('should return a Device from a complete JSON (repo format)', () => {
                const result: Device = deviceEntityMapper.transform(deviceRepoJSON)

                assert.propertyVal(result, 'id', deviceRepoJSON.id)
                assert.propertyVal(result, 'name', deviceRepoJSON.name)
                assert.propertyVal(result, 'address', deviceRepoJSON.address)
                assert.propertyVal(result, 'type', deviceRepoJSON.type)
                assert.propertyVal(result, 'last_sync', deviceRepoJSON.last_sync)
                assert.propertyVal(result, 'patient_id', deviceRepoJSON.patient_id)
            })

            it('should return a Device from a complete JSON (fitbit format)', () => {
                const result: Device = deviceEntityMapper.transform(deviceFitbitJSON)

                assert.propertyVal(result, 'id', deviceFitbitJSON.id)
                assert.propertyVal(result, 'name', deviceFitbitJSON.deviceVersion)
                assert.propertyVal(result, 'address', deviceFitbitJSON.mac)
                assert.propertyVal(result, 'type', deviceFitbitJSON.type)
                assert.propertyVal(result, 'last_sync',
                    moment(deviceFitbitJSON.lastSyncTime).utc().format(`YYYY-MM-DDTHH:mm:ss.SSS[Z]`))
                assert.propertyVal(result, 'patient_id', deviceFitbitJSON.patient_id)
            })

            it('should return a Device with some attributes equal to undefined from an empty JSON', () => {
                const result: Device = deviceEntityMapper.transform({})

                assert.isUndefined(result.id)
                assert.isUndefined(result.name)
                assert.isUndefined(result.address)
                assert.isUndefined(result.last_sync)
            })
        })

        context('when the parameter is undefined', () => {
            it('should return a Device with some attributes equal to undefined from undefined json', () => {
                const result: Device = deviceEntityMapper.transform(undefined)

                assert.isUndefined(result.id)
            })
        })
    })

    describe('modelEntityToModel()', () => {
        context('when try to use modelEntityToModel() function', () => {
            it('should throw an error', () => {
                try {
                    deviceEntityMapper.modelEntityToModel(new DeviceEntity())
                } catch (err) {
                    assert.propertyVal(err, 'message', 'Not implemented.')
                }
            })
        })
    })
})
