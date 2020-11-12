import { DIContainer } from '../../../src/di/di'
import { Identifier } from '../../../src/di/identifiers'
import { App } from '../../../src/app'
import { expect } from 'chai'
import { DeviceMock } from '../../mocks/models/device.mock'
import { Config } from '../../../src/utils/config'
import { IConnectionDB } from '../../../src/infrastructure/port/connection.db.interface'
import { IDeviceRepository } from '../../../src/application/port/device.repository.interface'
import { DeviceRepoModel } from '../../../src/infrastructure/database/schema/device.schema'
import { Device } from '../../../src/application/domain/model/device'
import { Strings } from '../../../src/utils/strings'

const dbConnection: IConnectionDB = DIContainer.get(Identifier.MONGODB_CONNECTION)
const app: App = DIContainer.get(Identifier.APP)
const request = require('supertest')(app.getExpress())
const deviceRepository: IDeviceRepository = DIContainer.get(Identifier.DEVICE_REPOSITORY)

describe('Routes: user.fitbit.devices', () => {
    // Starts DB connection and deletes all Devices.
    before(async () => {
        try {
            const mongoConfigs = Config.getMongoConfig()
            await dbConnection.tryConnect(mongoConfigs.uri, mongoConfigs.options)

            await deleteAllDevices()
        } catch (err) {
            throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
        }
    })

    // Delete all Devices and stops DB connection.
    after(async () => {
        try {
            await deleteAllDevices()

            await dbConnection.dispose()
        } catch (err) {
            throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
        }
    })

    /**
     * POST route to Device
     */

    /**
     * GET All route to Device
     */
    describe('GET /v1/devices', () => {
        // Mock objects for GET All routes of Device.
        const patientId = '5a62be07de34500146d9c544'
        const deviceGet: Device = new DeviceMock().generate()
        deviceGet.name = 'Default Device 1'
        deviceGet.type = 'Default Type'
        deviceGet.last_sync = '2020-09-01T10:00:00.000Z'
        deviceGet.patient_id = patientId
        const deviceGet2: Device = new DeviceMock().generate()
        deviceGet2.name = 'Other Device 2'
        deviceGet2.last_sync = '2020-11-30T20:00:00.000Z'
        deviceGet2.patient_id = patientId
        const deviceGet3: Device = new DeviceMock().generate()
        deviceGet3.name = 'Other Device 3'
        deviceGet3.type = 'Other Type'
        deviceGet3.last_sync = '2020-10-31T20:00:00.000Z'
        deviceGet3.patient_id = patientId

        context('when get all Devices successfully', () => {
            let result
            let result2

            before(async () => {
                try {
                    await deleteAllDevices()

                    result = await createDevice(deviceGet)
                    result2 = await createDevice(deviceGet2)
                } catch (err) {
                    throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
                }
            })

            it('should return status code 200 and a list of all Devices', () => {
                return request
                    .get(`/v1/users/${patientId}/fitbit/devices`)
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(2)
                        expect(res.headers['x-total-count']).to.eql('2')
                        expect(res.body[0].id).to.eql(result2.id)
                        expect(res.body[0].name).to.eql(deviceGet2.name)
                        expect(res.body[0].address).to.eql(deviceGet2.address)
                        expect(res.body[0].type).to.eql(deviceGet2.type)
                        expect(res.body[0].last_sync).to.eql(deviceGet2.last_sync)
                        expect(res.body[0].patient_id).to.eql(deviceGet2.patient_id)
                        expect(res.body[1].id).to.eql(result.id)
                        expect(res.body[1].name).to.eql(deviceGet.name)
                        expect(res.body[1].address).to.eql(deviceGet.address)
                        expect(res.body[1].type).to.eql(deviceGet.type)
                        expect(res.body[1].last_sync).to.eql(deviceGet.last_sync)
                        expect(res.body[1].patient_id).to.eql(deviceGet.patient_id)
                    })
            })
        })

        context('when there are no Devices', () => {
            before(async () => {
                try {
                    await deleteAllDevices()
                } catch (err) {
                    throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
                }
            })

            it('should return status code 200 and an empty list', () => {
                return request
                    .get(`/v1/users/${patientId}/fitbit/devices`)
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(0)
                        expect(res.headers['x-total-count']).to.eql('0')
                    })
            })
        })

        /**
         * query-strings-parser library test
         */
        context('when use "query-strings-parser" library', () => {
            let result
            let result2
            let result3

            before(async () => {
                try {
                    await deleteAllDevices()

                    result = await createDevice(deviceGet)
                    result2 = await createDevice(deviceGet2)
                    result3 = await createDevice(deviceGet3)
                } catch (err) {
                    throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
                }
            })

            it('should return status code 200 and the result as requested in the query (page 1 with a maximum of ' +
                '10 Devices, sorted in descending order by name, and which have a certain string at the beginning of their name)',
                () => {
                    const url = `/v1/users/${patientId}/fitbit/devices`
                        .concat(`?name=other*`)
                        .concat('&sort=-name&page=1&limit=10')

                    return request
                        .get(url)
                        .expect(200)
                        .then(res => {
                            expect(res.body.length).to.eql(2)
                            expect(res.headers['x-total-count']).to.eql('2')
                            expect(res.body[0].id).to.eql(result3.id)
                            expect(res.body[0].name).to.eql(deviceGet3.name)
                            expect(res.body[0].address).to.eql(deviceGet3.address)
                            expect(res.body[0].type).to.eql(deviceGet3.type)
                            expect(res.body[0].last_sync).to.eql(deviceGet3.last_sync)
                            expect(res.body[0].patient_id).to.eql(deviceGet3.patient_id)
                            expect(res.body[1].id).to.eql(result2.id)
                            expect(res.body[1].name).to.eql(deviceGet2.name)
                            expect(res.body[1].address).to.eql(deviceGet2.address)
                            expect(res.body[1].type).to.eql(deviceGet2.type)
                            expect(res.body[1].last_sync).to.eql(deviceGet2.last_sync)
                            expect(res.body[1].patient_id).to.eql(deviceGet2.patient_id)
                        })
                })

            it('should return status code 200 and the result as requested in the query (page 1 with a maximum of ' +
                '10 Devices, sorted in descending order by name, and which have type=TRACKER)',
                () => {
                    const url = `/v1/users/${patientId}/fitbit/devices`
                        .concat(`?type=TRACKER`)
                        .concat('&sort=-name&page=1&limit=10')

                    return request
                        .get(url)
                        .expect(200)
                        .then(res => {
                            expect(res.body.length).to.eql(1)
                            expect(res.headers['x-total-count']).to.eql('1')
                            expect(res.body[0].id).to.eql(result2.id)
                            expect(res.body[0].name).to.eql(deviceGet2.name)
                            expect(res.body[0].address).to.eql(deviceGet2.address)
                            expect(res.body[0].type).to.eql(deviceGet2.type)
                            expect(res.body[0].last_sync).to.eql(deviceGet2.last_sync)
                            expect(res.body[0].patient_id).to.eql(deviceGet2.patient_id)
                        })
                })

            it('should return status code 200 and the result as requested in the query (page 1 with a maximum of ' +
                '10 Devices, sorted in descending order by name, and that have the last_sync in a certain time interval)', () => {
                const url = `/v1/users/${patientId}/fitbit/devices`
                    .concat('?last_sync=gte:2020-09-01T00:00:00.000Z&last_sync=lte:2020-10-31T23:59:59.999Z')
                    .concat('&sort=-name&page=1&limit=10')

                return request
                    .get(url)
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(2)
                        expect(res.headers['x-total-count']).to.eql('2')
                        expect(res.body[0].id).to.eql(result3.id)
                        expect(res.body[0].name).to.eql(deviceGet3.name)
                        expect(res.body[0].address).to.eql(deviceGet3.address)
                        expect(res.body[0].type).to.eql(deviceGet3.type)
                        expect(res.body[0].last_sync).to.eql(deviceGet3.last_sync)
                        expect(res.body[0].patient_id).to.eql(deviceGet3.patient_id)
                        expect(res.body[1].id).to.eql(result.id)
                        expect(res.body[1].name).to.eql(deviceGet.name)
                        expect(res.body[1].address).to.eql(deviceGet.address)
                        expect(res.body[1].type).to.eql(deviceGet.type)
                        expect(res.body[1].last_sync).to.eql(deviceGet.last_sync)
                        expect(res.body[1].patient_id).to.eql(deviceGet.patient_id)
                    })
            })
        })

        context('when a validation error occurs', () => {
            before(async () => {
                try {
                    await deleteAllDevices()

                    await createDevice(deviceGet)
                    await createDevice(deviceGet2)
                } catch (err) {
                    throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
                }
            })

            context('when the Patient id is invalid', () => {
                it('should return status code 400 and info message about the invalid Patient id', () => {
                    return request
                        .get('/v1/users/123/fitbit/devices')
                        .expect(400)
                        .then(err => {
                            expect(err.body.code).to.eql(400)
                            expect(err.body.message).to.eql(Strings.PATIENT.PARAM_ID_NOT_VALID_FORMAT)
                            expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                        })
                })
            })
        })
    })
})

async function createDevice(device: Device): Promise<Device> {
    const deviceSaved: Device = await deviceRepository.create(device)
    return Promise.resolve(deviceSaved)
}

async function deleteAllDevices() {
    return DeviceRepoModel.deleteMany({})
}
