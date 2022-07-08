import { FitbitDevice } from '../../../src/application/domain/model/fitbit.device'
import { IFitbitDeviceRepository } from '../../../src/application/port/fitbit.device.repository.interface'
import { DIContainer } from '../../../src/di/di'
import { Identifier } from '../../../src/di/identifiers'
import { DeviceRepoModel } from '../../../src/infrastructure/database/schema/device.schema'

/**
 * Class with some object creation functions that are used in integration tests.
 */
export class RepositoryUtils {
    private _fitbitDeviceRepository: IFitbitDeviceRepository = DIContainer.get(Identifier.FITBIT_DEVICE_REPOSITORY)

    get fitbitDeviceRepository(): IFitbitDeviceRepository {
        return this._fitbitDeviceRepository
    }

    set fitbitDeviceRepository(value: IFitbitDeviceRepository) {
        this._fitbitDeviceRepository = value
    }

    /**
     * CREATE FUNCTIONS
     */
    // FITBIT DEVICE
    public async createFitbitDevice(fitbitDevice: FitbitDevice): Promise<FitbitDevice | undefined> {
        const fitbitDeviceSaved: FitbitDevice | undefined = await this.fitbitDeviceRepository.create(fitbitDevice)
        return Promise.resolve(fitbitDeviceSaved)
    }

    /**
     * DELETE FUNCTIONS
     */
    // DEVICE
    public async deleteAllDevices() {
        return DeviceRepoModel.deleteMany({})
    }
}

export const repoUtils = new RepositoryUtils()
