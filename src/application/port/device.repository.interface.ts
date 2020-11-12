import { IRepository } from './repository.interface'
import { Device } from '../domain/model/device'
import { IQuery } from './query.interface'

/**
 * Interface of the Device repository.
 * Must be implemented by the Device repository at the infrastructure layer.
 *
 * @see {@link DeviceRepository} for further information.
 * @extends {IRepository<Device>}
 */
export interface IDeviceRepository extends IRepository<Device> {
    /**
     * Remove devices through a query.
     *
     * @param query Defines object to be used for queries.
     * @return {Promise<boolean>}
     * @throws {ValidationException | RepositoryException}
     */
    removeByQuery(query: IQuery): Promise<boolean>
}
