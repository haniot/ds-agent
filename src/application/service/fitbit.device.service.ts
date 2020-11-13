import { IQuery } from '../port/query.interface'
import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { IFitbitDeviceRepository } from '../port/fitbit.device.repository.interface'
import { ObjectIdValidator } from '../domain/validator/object.id.validator'
import { IFitbitDeviceService } from '../port/fitbit.device.service.interface'
import { Strings } from '../../utils/strings'
import { FitbitDevice } from '../domain/model/fitbit.device'

@injectable()
export class FitbitDeviceService implements IFitbitDeviceService {
    constructor(
        @inject(Identifier.FITBIT_DEVICE_REPOSITORY) private readonly _fitbitDeviceRepo: IFitbitDeviceRepository
    ) {
    }

    public async add(item: FitbitDevice): Promise<FitbitDevice> {
        throw Error('Not implemented!')
    }

    public getAll(query: IQuery): Promise<Array<FitbitDevice>> {
        throw Error('Not implemented!')
    }

    public getById(id: string, query: IQuery): Promise<FitbitDevice> {
        throw Error('Not implemented!')
    }

    public remove(id: string): Promise<boolean> {
        throw Error('Not implemented!')
    }

    public update(item: FitbitDevice): Promise<FitbitDevice> {
        throw Error('Not implemented!')
    }

    /**
     * List a user's fitbit devices.
     *
     * @param userId User ID.
     * @param query Defines object to be used for queries.
     * @return {Promise<Array<FitbitDevice>>}
     * @throws {ValidationException | RepositoryException}
     */
    public async getAllByUser(userId: string, query: IQuery): Promise<Array<FitbitDevice>> {
        try {
            // 1. Validate the User Id.
            ObjectIdValidator.validate(userId, Strings.USER.PARAM_ID_NOT_VALID_FORMAT)

            // 2. Returns the fitbit devices associated with the User received or an empty array.
            return this._fitbitDeviceRepo.find(query)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    /**
     * Returns the total number of fitbit devices for a user.
     *
     * @param query Defines object to be used for queries.
     * @return {Promise<number>}
     * @throws {RepositoryException}
     */
    public count(query: IQuery): Promise<number> {
        return this._fitbitDeviceRepo.count(query)
    }
}
