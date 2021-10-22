import { DIContainer } from '../../../src/di/di'
import { Identifier } from '../../../src/di/identifiers'
import { App } from '../../../src/app'
import { expect } from 'chai'
import { FitbitDeviceMock } from '../../mocks/models/fitbit.device.mock'
import { Config } from '../../../src/utils/config'
import { IConnectionDB } from '../../../src/infrastructure/port/connection.db.interface'
import { IFitbitDeviceRepository } from '../../../src/application/port/fitbit.device.repository.interface'
import { DeviceRepoModel } from '../../../src/infrastructure/database/schema/device.schema'
import { FitbitDevice } from '../../../src/application/domain/model/fitbit.device'
import { Strings } from '../../../src/utils/strings'

const dbConnection: IConnectionDB = DIContainer.get(Identifier.MONGODB_CONNECTION)
const app: App = DIContainer.get(Identifier.APP)
const request = require('supertest')(app.getExpress())
const fitbitDeviceRepository: IFitbitDeviceRepository = DIContainer.get(Identifier.FITBIT_DEVICE_REPOSITORY)

describe('Routes: user.fitbit.devices', () => {
    // Starts DB connection and deletes all FitbitDevices.
    before(async () => {
        try {
            const mongoConfigs = Config.getMongoConfig()
            await dbConnection.tryConnect(mongoConfigs.uri, mongoConfigs.options)

            await deleteAllFitbitDevices()
        } catch (err: any) {
            throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
        }
    })

    // Delete all FitbitDevices and stops DB connection.
    after(async () => {
        try {
            await deleteAllFitbitDevices()

            await dbConnection.dispose()
        } catch (err: any) {
            throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
        }
    })

    /**
     * GET All route to FitbitDevice
     */
    describe('GET /v1/devices', () => {
        // Mock objects for GET All routes of FitbitDevice.
        const userId = '5a62be07de34500146d9c544'
        const fitbitDeviceGet: FitbitDevice = new FitbitDeviceMock().generate()
        fitbitDeviceGet.name = 'Default Fitbit Device 1'
        fitbitDeviceGet.type = 'Default Type'
        fitbitDeviceGet.last_sync = '2020-09-01T10:00:00.000Z'
        fitbitDeviceGet.user_id = userId
        const fitbitDeviceGet2: FitbitDevice = new FitbitDeviceMock().generate()
        fitbitDeviceGet2.name = 'Other Fitbit Device 2'
        fitbitDeviceGet2.last_sync = '2020-11-30T20:00:00.000Z'
        fitbitDeviceGet2.user_id = userId
        const fitbitDeviceGet3: FitbitDevice = new FitbitDeviceMock().generate()
        fitbitDeviceGet3.name = 'Other Fitbit Device 3'
        fitbitDeviceGet3.type = 'Other Type'
        fitbitDeviceGet3.last_sync = '2020-10-31T20:00:00.000Z'
        fitbitDeviceGet3.user_id = userId

        context('when get all FitbitDevices successfully', () => {
            let result
            let result2

            before(async () => {
                try {
                    await deleteAllFitbitDevices()

                    result = await createFitbitDevice(fitbitDeviceGet)
                    result2 = await createFitbitDevice(fitbitDeviceGet2)
                } catch (err: any) {
                    throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
                }
            })

            it('should return status code 200 and a list of all FitbitDevices', () => {
                return request
                    .get(`/v1/users/${userId}/fitbit/devices`)
                    .expect(200)
                    .then(res => {
                        expect(res.body.length).to.eql(2)
                        expect(res.headers['x-total-count']).to.eql('2')
                        expect(res.body[0].id).to.eql(result2.id)
                        expect(res.body[0].name).to.eql(fitbitDeviceGet2.name)
                        expect(res.body[0].address).to.eql(fitbitDeviceGet2.address)
                        expect(res.body[0].type).to.eql(fitbitDeviceGet2.type)
                        expect(res.body[0].last_sync).to.eql(fitbitDeviceGet2.last_sync)
                        expect(res.body[0].user_id).to.eql(fitbitDeviceGet2.user_id)
                        expect(res.body[1].id).to.eql(result.id)
                        expect(res.body[1].name).to.eql(fitbitDeviceGet.name)
                        expect(res.body[1].address).to.eql(fitbitDeviceGet.address)
                        expect(res.body[1].type).to.eql(fitbitDeviceGet.type)
                        expect(res.body[1].last_sync).to.eql(fitbitDeviceGet.last_sync)
                        expect(res.body[1].user_id).to.eql(fitbitDeviceGet.user_id)
                    })
            })
        })

        context('when there are no FitbitDevices', () => {
            before(async () => {
                try {
                    await deleteAllFitbitDevices()
                } catch (err: any) {
                    throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
                }
            })

            it('should return status code 200 and an empty list', () => {
                return request
                    .get(`/v1/users/${userId}/fitbit/devices`)
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
                    await deleteAllFitbitDevices()

                    result = await createFitbitDevice(fitbitDeviceGet)
                    result2 = await createFitbitDevice(fitbitDeviceGet2)
                    result3 = await createFitbitDevice(fitbitDeviceGet3)
                } catch (err: any) {
                    throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
                }
            })

            it('should return status code 200 and the result as requested in the query (page 1 with a maximum of ' +
                '10 FitbitDevices, sorted in descending order by name, and which have a certain string at the beginning ' +
                'of their name)',
                () => {
                    const url = `/v1/users/${userId}/fitbit/devices`
                        .concat(`?name=other*`)
                        .concat('&sort=-name&page=1&limit=10')

                    return request
                        .get(url)
                        .expect(200)
                        .then(res => {
                            expect(res.body.length).to.eql(2)
                            expect(res.headers['x-total-count']).to.eql('2')
                            expect(res.body[0].id).to.eql(result3.id)
                            expect(res.body[0].name).to.eql(fitbitDeviceGet3.name)
                            expect(res.body[0].address).to.eql(fitbitDeviceGet3.address)
                            expect(res.body[0].type).to.eql(fitbitDeviceGet3.type)
                            expect(res.body[0].last_sync).to.eql(fitbitDeviceGet3.last_sync)
                            expect(res.body[0].user_id).to.eql(fitbitDeviceGet3.user_id)
                            expect(res.body[1].id).to.eql(result2.id)
                            expect(res.body[1].name).to.eql(fitbitDeviceGet2.name)
                            expect(res.body[1].address).to.eql(fitbitDeviceGet2.address)
                            expect(res.body[1].type).to.eql(fitbitDeviceGet2.type)
                            expect(res.body[1].last_sync).to.eql(fitbitDeviceGet2.last_sync)
                            expect(res.body[1].user_id).to.eql(fitbitDeviceGet2.user_id)
                        })
                })

            it('should return status code 200 and the result as requested in the query (page 1 with a maximum of ' +
                '10 FitbitDevices, sorted in descending order by name, and which have type=TRACKER)',
                () => {
                    const url = `/v1/users/${userId}/fitbit/devices`
                        .concat(`?type=TRACKER`)
                        .concat('&sort=-name&page=1&limit=10')

                    return request
                        .get(url)
                        .expect(200)
                        .then(res => {
                            expect(res.body.length).to.eql(1)
                            expect(res.headers['x-total-count']).to.eql('1')
                            expect(res.body[0].id).to.eql(result2.id)
                            expect(res.body[0].name).to.eql(fitbitDeviceGet2.name)
                            expect(res.body[0].address).to.eql(fitbitDeviceGet2.address)
                            expect(res.body[0].type).to.eql(fitbitDeviceGet2.type)
                            expect(res.body[0].last_sync).to.eql(fitbitDeviceGet2.last_sync)
                            expect(res.body[0].user_id).to.eql(fitbitDeviceGet2.user_id)
                        })
                })

            it('should return status code 200 and the result as requested in the query (page 1 with a maximum of ' +
                '10 FitbitDevices, sorted in descending order by name, and that have the last_sync in a certain time interval)',
                () => {
                    const url = `/v1/users/${userId}/fitbit/devices`
                        .concat('?last_sync=gte:2020-09-01T00:00:00.000Z&last_sync=lte:2020-10-31T23:59:59.999Z')
                        .concat('&sort=-name&page=1&limit=10')

                    return request
                        .get(url)
                        .expect(200)
                        .then(res => {
                            expect(res.body.length).to.eql(2)
                            expect(res.headers['x-total-count']).to.eql('2')
                            expect(res.body[0].id).to.eql(result3.id)
                            expect(res.body[0].name).to.eql(fitbitDeviceGet3.name)
                            expect(res.body[0].address).to.eql(fitbitDeviceGet3.address)
                            expect(res.body[0].type).to.eql(fitbitDeviceGet3.type)
                            expect(res.body[0].last_sync).to.eql(fitbitDeviceGet3.last_sync)
                            expect(res.body[0].user_id).to.eql(fitbitDeviceGet3.user_id)
                            expect(res.body[1].id).to.eql(result.id)
                            expect(res.body[1].name).to.eql(fitbitDeviceGet.name)
                            expect(res.body[1].address).to.eql(fitbitDeviceGet.address)
                            expect(res.body[1].type).to.eql(fitbitDeviceGet.type)
                            expect(res.body[1].last_sync).to.eql(fitbitDeviceGet.last_sync)
                            expect(res.body[1].user_id).to.eql(fitbitDeviceGet.user_id)
                        })
                })
        })

        context('when a validation error occurs', () => {
            before(async () => {
                try {
                    await deleteAllFitbitDevices()

                    await createFitbitDevice(fitbitDeviceGet)
                    await createFitbitDevice(fitbitDeviceGet2)
                } catch (err: any) {
                    throw new Error('Failure on user.fitbit.devices routes test: ' + err.message)
                }
            })

            context('when the User id is invalid', () => {
                it('should return status code 400 and info message about the invalid User id', () => {
                    return request
                        .get('/v1/users/123/fitbit/devices')
                        .expect(400)
                        .then(err => {
                            expect(err.body.code).to.eql(400)
                            expect(err.body.message).to.eql(Strings.USER.PARAM_ID_NOT_VALID_FORMAT)
                            expect(err.body.description).to.eql(Strings.ERROR_MESSAGE.UUID_NOT_VALID_FORMAT_DESC)
                        })
                })
            })
        })
    })
})

async function createFitbitDevice(fitbitDevice: FitbitDevice): Promise<FitbitDevice | undefined> {
    const fitbitDeviceSaved: FitbitDevice | undefined = await fitbitDeviceRepository.create(fitbitDevice)
    return Promise.resolve(fitbitDeviceSaved)
}

async function deleteAllFitbitDevices() {
    return DeviceRepoModel.deleteMany({})
}
