import { IRepository } from './repository.interface'
import { IQuery } from './query.interface'
import { FitbitDevice } from '../domain/model/fitbit.device'

/**
 * Interface of the FitbitDevice repository.
 * Must be implemented by the FitbitDevice repository at the infrastructure layer.
 *
 * @see {@link FitbitDeviceRepository} for further information.
 * @extends {IRepository<Device>}
 */
export interface IFitbitDeviceRepository extends IRepository<FitbitDevice> {
    /**
     * Synchronizes the user's Fitbit devices, maps their attributes and persists in the database.
     *
     * @param scopes User Fitbit scopes.
     * @param token User Fitbit access token.
     * @param userId User ID.
     * @return {Promise<void>}
     * @throws {FitbitClientException | ValidationException | RepositoryException}
     */
    syncAndParse(scopes: Array<string>, token: string, userId: string): Promise<void>

    /**
     * Removes devices through a query.
     *
     * @param query Defines object to be used for queries.
     * @return {Promise<boolean>}
     * @throws {ValidationException | RepositoryException}
     */
    removeByQuery(query: IQuery): Promise<boolean>
}
