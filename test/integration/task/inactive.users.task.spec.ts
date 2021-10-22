import { expect } from 'chai'
import { DIContainer } from '../../../src/di/di'
import { Identifier } from '../../../src/di/identifiers'
import { IBackgroundTask } from '../../../src/application/port/background.task.interface'
import { Default } from '../../../src/utils/default'
import { ILogger } from '../../../src/utils/custom.logger'
import { IConnectionDB } from '../../../src/infrastructure/port/connection.db.interface'
import { IUserAuthDataService } from '../../../src/application/port/user.auth.data.service.interface'
import { DeviceRepoModel } from '../../../src/infrastructure/database/schema/device.schema'
import { InactiveUsersTask } from '../../../src/background/task/inactive.users.task'
import { IFitbitDeviceService } from '../../../src/application/port/fitbit.device.service.interface'
import { FitbitDevice } from '../../../src/application/domain/model/fitbit.device'
import { IFitbitDeviceRepository } from '../../../src/application/port/fitbit.device.repository.interface'
import { IUserAuthDataRepository } from '../../../src/application/port/user.auth.data.repository.interface'
import { UserAuthData } from '../../../src/application/domain/model/user.auth.data'
import { FitbitDeviceMock } from '../../mocks/models/fitbit.device.mock'
import { UserAuthDataMock } from '../../mocks/models/user.auth.data.mock'
import { UserAuthRepoModel } from '../../../src/infrastructure/database/schema/oauth.data.schema'
import { IEventBus } from '../../../src/infrastructure/port/event.bus.interface'

const eventBus: IEventBus = DIContainer.get(Identifier.RABBITMQ_EVENT_BUS)
const dbConnection: IConnectionDB = DIContainer.get(Identifier.MONGODB_CONNECTION)
const userAuthDataService: IUserAuthDataService = DIContainer.get(Identifier.USER_AUTH_DATA_SERVICE)
const userAuthDataRepository: IUserAuthDataRepository = DIContainer.get(Identifier.USER_AUTH_DATA_REPOSITORY)
const fitbitDeviceService: IFitbitDeviceService = DIContainer.get(Identifier.FITBIT_DEVICE_SERVICE)
const fitbitDeviceRepository: IFitbitDeviceRepository = DIContainer.get(Identifier.FITBIT_DEVICE_REPOSITORY)
const logger: ILogger = DIContainer.get(Identifier.LOGGER)

describe('INACTIVE USERS TASK', () => {
    // Starts DB connection, deletes all Fitbit devices and users data.
    before(async () => {
        try {
            await dbConnection.tryConnect(process.env.MONGODB_URI_TEST || Default.MONGODB_URI_TEST)

            await deleteAllFitbitDevices()
            await deleteAllUserAuthData()
        } catch (err: any) {
            throw new Error('Failure on InactiveUsersTask test: ' + err.message)
        }
    })

    // Deletes all Fitbit devices and users data and stops DB connection.
    after(async () => {
        try {
            await deleteAllFitbitDevices()
            await deleteAllUserAuthData()

            await dbConnection.dispose()
        } catch (err: any) {
            throw new Error('Failure on InactiveUsersTask test: ' + err.message)
        }
    })

    describe('run()', () => {
        context('when the InactiveUsersTask is executed successfully and the user has an active device', () => {
            const userAuthData: UserAuthData = new UserAuthDataMock().generate()
            const fitbitDevice: FitbitDevice = new FitbitDeviceMock().generate()
            fitbitDevice.user_id = userAuthData.user_id!

            before(async () => {
                try {
                    await deleteAllFitbitDevices()
                    await deleteAllUserAuthData()

                    await createUserAuthData(userAuthData)
                    await createFitbitDevice(fitbitDevice)
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })

            after(async () => {
                try {
                    await deleteAllFitbitDevices()
                    await deleteAllUserAuthData()
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })

            it('should not do anything to the user because the device is active', async () => {
                try {
                    const inactiveUsersTask: IBackgroundTask =
                        new InactiveUsersTask(eventBus, userAuthDataService, fitbitDeviceService, logger, 7)

                    await inactiveUsersTask.run()

                    // Performing the test
                    const userAuthDataResult = await userAuthDataRepository.getUserAuthDataByUserId(userAuthData.user_id!)
                    expect(userAuthDataResult.fitbit?.access_token).to.eql('Access Token')
                    await inactiveUsersTask.stop()
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })
        })

        context('when the InactiveUsersTask is executed successfully and the user has inactive devices', () => {
            const userAuthData: UserAuthData = new UserAuthDataMock().generate()
            const fitbitDevice: FitbitDevice = new FitbitDeviceMock().generate()
            fitbitDevice.user_id = userAuthData.user_id!
            fitbitDevice.last_sync = '2020-11-09T00:00:00.000Z'
            const otherFitbitDevice: FitbitDevice = new FitbitDeviceMock().generate()
            otherFitbitDevice.user_id = userAuthData.user_id!
            otherFitbitDevice.last_sync = '2020-11-05T00:00:00.000Z'

            before(async () => {
                try {
                    await deleteAllFitbitDevices()
                    await deleteAllUserAuthData()

                    await createUserAuthData(userAuthData)
                    await createFitbitDevice(fitbitDevice)
                    await createFitbitDevice(otherFitbitDevice)
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })

            after(async () => {
                try {
                    await deleteAllFitbitDevices()
                    await deleteAllUserAuthData()
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })

            it('should revoke the user\'s Fitbit access', async () => {
                try {
                    const inactiveUsersTask: IBackgroundTask =
                        new InactiveUsersTask(eventBus, userAuthDataService, fitbitDeviceService, logger, 7)

                    await inactiveUsersTask.run()

                    // Performing the test
                    const userAuthDataResult = await userAuthDataRepository.getUserAuthDataByUserId(userAuthData.user_id!)
                    expect(userAuthDataResult.fitbit?.access_token).to.be.undefined
                    await inactiveUsersTask.stop()
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })
        })

        context('when the InactiveUsersTask is executed successfully and the user has no devices', () => {
            const userAuthData: UserAuthData = new UserAuthDataMock().generate()

            before(async () => {
                try {
                    await deleteAllFitbitDevices()
                    await deleteAllUserAuthData()

                    await createUserAuthData(userAuthData)
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })

            after(async () => {
                try {
                    await deleteAllFitbitDevices()
                    await deleteAllUserAuthData()
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })

            it('should not do anything to the user because he has no Devices', async () => {
                try {
                    const inactiveUsersTask: IBackgroundTask =
                        new InactiveUsersTask(eventBus, userAuthDataService, fitbitDeviceService, logger, 7)

                    await inactiveUsersTask.run()

                    const userAuthDataResult = await userAuthDataRepository.getUserAuthDataByUserId(userAuthData.user_id!)
                    expect(userAuthDataResult.fitbit?.access_token).to.eql('Access Token')
                    await inactiveUsersTask.stop()
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })
        })

        context('when the InactiveUsersTask is executed successfully and there is no user', () => {
            before(async () => {
                try {
                    await deleteAllFitbitDevices()
                    await deleteAllUserAuthData()
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })

            after(async () => {
                try {
                    await deleteAllFitbitDevices()
                    await deleteAllUserAuthData()
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })

            it('the task should be executed normally', async () => {
                try {
                    const inactiveUsersTask: IBackgroundTask =
                        new InactiveUsersTask(eventBus, userAuthDataService, fitbitDeviceService, logger, 7)

                    await inactiveUsersTask.run()

                    await inactiveUsersTask.stop()
                } catch (err: any) {
                    throw new Error('Failure on Task InactiveUsersTask test: ' + err.message)
                }
            })
        })
    })
})

async function createUserAuthData(userAuthData: UserAuthData): Promise<UserAuthData | undefined> {
    const userAuthDataSaved: UserAuthData | undefined = await userAuthDataRepository.create(userAuthData)
    return Promise.resolve(userAuthDataSaved)
}

async function deleteAllUserAuthData() {
    return UserAuthRepoModel.deleteMany({})
}

async function createFitbitDevice(fitbitDevice: FitbitDevice): Promise<FitbitDevice | undefined> {
    const fitbitDeviceSaved: FitbitDevice | undefined = await fitbitDeviceRepository.create(fitbitDevice)
    return Promise.resolve(fitbitDeviceSaved)
}

async function deleteAllFitbitDevices() {
    return DeviceRepoModel.deleteMany({})
}


