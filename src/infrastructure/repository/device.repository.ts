import { BaseRepository } from './base/base.repository'
import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { IEntityMapper } from '../port/entity.mapper.interface'
import { ILogger } from '../../utils/custom.logger'
import { Device } from '../../application/domain/model/device'
import { DeviceEntity } from '../entity/device.entity'
import { IDeviceRepository } from '../../application/port/device.repository.interface'
import { IQuery } from '../../application/port/query.interface'

@injectable()
export class DeviceRepository extends BaseRepository<Device, DeviceEntity> implements IDeviceRepository {

    constructor(
        @inject(Identifier.DEVICE_REPO_MODEL) readonly _deviceRepoModel: any,
        @inject(Identifier.DEVICE_ENTITY_MAPPER) readonly _deviceEntityMapper: IEntityMapper<Device, DeviceEntity>,
        @inject(Identifier.LOGGER) readonly _logger: ILogger
    ) {
        super(_deviceRepoModel, _deviceEntityMapper, _logger)
    }

    /**
     * Remove devices through a query.
     *
     * @param query Defines object to be used for queries.
     * @return {Promise<boolean>}
     * @throws {ValidationException | RepositoryException}
     */
    public removeByQuery(query: IQuery): Promise<boolean> {
        const q: any = query.toJSON()
        return new Promise<boolean>((resolve, reject) => {
            this._deviceRepoModel.deleteMany(q.filters)
                .then(res => resolve(!!res))
                .catch(err => reject(super.mongoDBErrorListener(err)))
        })
    }
}
