import { IService } from './service.interface'
import { Device } from '../domain/model/device'
import { IQuery } from './query.interface'

/**
 * Device service interface.
 *
 * @extends {IService<Device>}
 */
export interface IDeviceService extends IService<Device> {
    /**
     * List a user's devices.
     *
     * @param userId User ID.
     * @param query Defines object to be used for queries.
     * @return {Promise<Array<Device>>}
     * @throws {ValidationException | RepositoryException}
     */
    getAllByUser(userId: string, query: IQuery): Promise<Array<Device>>

    /**
     * Returns the total number of devices for a user.
     *
     * @param query Defines object to be used for queries.
     * @return {Promise<number>}
     * @throws {RepositoryException}
     */
    count(query: IQuery): Promise<number>
}
