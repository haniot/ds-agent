import { IService } from './service.interface'
import { IQuery } from './query.interface'
import { FitbitDevice } from '../domain/model/fitbit.device'

/**
 * FitbitDevice service interface.
 *
 * @extends {IService<FitbitDevice>}
 */
export interface IFitbitDeviceService extends IService<FitbitDevice> {
    /**
     * List a user's fitbit devices.
     *
     * @param userId User ID.
     * @param query Defines object to be used for queries.
     * @return {Promise<Array<FitbitDevice>>}
     * @throws {ValidationException | RepositoryException}
     */
    getAllByUser(userId: string, query: IQuery): Promise<Array<FitbitDevice>>

    /**
     * Returns the total number of fitbit devices for a user.
     *
     * @param query Defines object to be used for queries.
     * @return {Promise<number>}
     * @throws {RepositoryException}
     */
    count(query: IQuery): Promise<number>
}
