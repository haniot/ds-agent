import { BaseRepository } from './base/base.repository'
import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { IEntityMapper } from '../port/entity.mapper.interface'
import { ILogger } from '../../utils/custom.logger'
import { IFitbitDeviceRepository } from '../../application/port/fitbit.device.repository.interface'
import { IQuery } from '../../application/port/query.interface'
import { Query } from './query/query'
import { IFitbitClientRepository } from '../../application/port/fitbit.client.repository.interface'
import { FitbitDeviceEntity } from '../entity/fitbit.device.entity'
import { FitbitDevice } from '../../application/domain/model/fitbit.device'

@injectable()
export class FitbitDeviceRepository extends BaseRepository<FitbitDevice, FitbitDeviceEntity> implements IFitbitDeviceRepository {
    constructor(
        @inject(Identifier.DEVICE_REPO_MODEL) private readonly _fitbitDeviceRepoModel: any,
        @inject(Identifier.FITBIT_DEVICE_ENTITY_MAPPER)
        private readonly _fitbitDeviceEntityMapper: IEntityMapper<FitbitDevice, FitbitDeviceEntity>,
        @inject(Identifier.FITBIT_CLIENT_REPOSITORY) private readonly _fitbitClientRepo: IFitbitClientRepository,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
        super(_fitbitDeviceRepoModel, _fitbitDeviceEntityMapper, _logger)
    }

    /**
     * Synchronizes the user's Fitbit devices, maps their attributes and persists in the database.
     *
     * @param scopes User Fitbit scopes.
     * @param token User Fitbit access token.
     * @param userId User ID.
     * @return {Promise<void>}
     * @throws {FitbitClientException | ValidationException | RepositoryException}
     */
    public async syncAndParse(scopes: Array<string>, token: string, userId: string): Promise<void> {
        try {
            // If the user does not have scopes for settings, returns.
            if (!(scopes.includes('rset'))) return Promise.resolve()
            // Syncs devices data.
            const syncDevices: Array<any> = await this.syncDevices(token)
            // Parses devices data.
            const parsedDevices: Array<FitbitDevice> = await this.parseDevices(syncDevices, userId)
            // Manages devices data.
            this.manageDevices(parsedDevices, userId).then().catch()
            return Promise.resolve()
        } catch (err) {
            return Promise.reject(err)
        }
    }

    /**
     * Synchronizes the user's Fitbit devices.
     *
     * @param token User Fitbit access token.
     * @return {Promise<any>}
     * @throws {FitbitClientException}
     */
    private async syncDevices(token: string): Promise<any> {
        const path: string = `/devices.json`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result))
                .catch(err => reject(err))
        })
    }

    /**
     * Maps Fitbit devices attributes.
     *
     * @param devices Fitbit devices array.
     * @param userId User ID.
     * @return {Array<FitbitDevice>}
     * @throws {ValidationException}
     */
    private parseDevices(devices: Array<any>, userId: string): Array<FitbitDevice> {
        if (!devices || !devices.length) return []
        return devices.map(item => this._fitbitDeviceEntityMapper.transform({ ...item, user_id: userId }))
    }

    /**
     * Manages Fitbit devices in the database.
     *
     * @param devices FitbitDevice array.
     * @param userId User ID.
     * @return {Promise<void>}
     * @throws {ValidationException | RepositoryException}
     */
    private async manageDevices(devices: Array<FitbitDevice>, userId: string): Promise<void> {
        try {
            await this.removeByQuery(new Query().fromJSON({ filters: { user_id: userId } }))
            await this.saveDevices(devices)
            return Promise.resolve()
        } catch (err) {
            this._logger.error(`Error at save devices: ${err.message}`)
            return Promise.resolve()
        }
    }

    /**
     * Creates Fitbit devices in the database.
     *
     * @param devices FitbitDevice array.
     * @return {Promise<Array<FitbitDevice>>}
     * @throws {ValidationException | RepositoryException}
     */
    private saveDevices(devices: Array<FitbitDevice>): Promise<Array<FitbitDevice>> {
        return new Promise<Array<FitbitDevice>>(async (resolve, reject) => {
            const result: Array<FitbitDevice> = []
            if (!devices || !devices.length) return resolve(result)
            try {
                for (const item of devices) {
                    const device: FitbitDevice = await this.create(item)
                    result.push(device)
                }
            } catch (err) {
                return reject(this.mongoDBErrorListener(err))
            }
            return resolve(result)
        })
    }

    /**
     * Removes devices through a query.
     *
     * @param query Defines object to be used for queries.
     * @return {Promise<boolean>}
     * @throws {ValidationException | RepositoryException}
     */
    public removeByQuery(query: IQuery): Promise<boolean> {
        const q: any = query.toJSON()
        return new Promise<boolean>((resolve, reject) => {
            this._fitbitDeviceRepoModel.deleteMany(q.filters)
                .then(res => resolve(!!res))
                .catch(err => reject(super.mongoDBErrorListener(err)))
        })
    }
}
