import { IQuery } from '../port/query.interface'
import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { IDeviceRepository } from '../port/device.repository.interface'
import { Device } from '../domain/model/device'
import { ObjectIdValidator } from '../domain/validator/object.id.validator'
import { IDeviceService } from '../port/device.service.interface'
import { Strings } from '../../utils/strings'

@injectable()
export class DeviceService implements IDeviceService {
    constructor(
        @inject(Identifier.DEVICE_REPOSITORY) private readonly _deviceRepo: IDeviceRepository
    ) {
    }

    public async add(item: Device): Promise<Device> {
        throw Error('Not implemented!')
    }

    public getAll(query: IQuery): Promise<Array<Device>> {
        throw Error('Not implemented!')
    }

    public getById(id: string, query: IQuery): Promise<Device> {
        throw Error('Not implemented!')
    }

    public remove(id: string): Promise<boolean> {
        throw Error('Not implemented!')
    }

    public update(item: Device): Promise<Device> {
        throw Error('Not implemented!')
    }

    /**
     * List a user's devices.
     *
     * @param userId User ID.
     * @param query Defines object to be used for queries.
     * @return {Promise<Array<Device>>}
     * @throws {ValidationException | RepositoryException}
     */
    public async getAllByUser(userId: string, query: IQuery): Promise<Array<Device>> {
        try {
            // 1. Validate the User Id.
            ObjectIdValidator.validate(userId, Strings.PATIENT.PARAM_ID_NOT_VALID_FORMAT)

            // 2. Returns the devices associated with the User received or an empty array.
            return this._deviceRepo.find(query)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    /**
     * Returns the total number of devices for a user.
     *
     * @param query Defines object to be used for queries.
     * @return {Promise<number>}
     * @throws {RepositoryException}
     */
    public count(query: IQuery): Promise<number> {
        return this._deviceRepo.count(query)
    }
}
