import { IEntityMapper } from '../../port/entity.mapper.interface'
import { FitbitDevice } from '../../../application/domain/model/fitbit.device'
import { FitbitDeviceEntity } from '../fitbit.device.entity'
import moment from 'moment'
import { injectable } from 'inversify'

@injectable()
export class FitbitDeviceEntityMapper implements IEntityMapper<FitbitDevice, FitbitDeviceEntity> {
    public jsonToModel(json: any): FitbitDevice {
        const result: FitbitDevice = new FitbitDevice()
        if (!json) return result

        if (json.id !== undefined) result.id = json.id
        result.name = json.deviceVersion || json.name
        result.address = json.mac || json.address
        if (json.type !== undefined) result.type = json.type
        result.last_sync =
            json.lastSyncTime !== undefined
                ? moment(json.lastSyncTime).utc().format(`YYYY-MM-DDTHH:mm:ss.SSS[Z]`)
                : json.last_sync
        if (json.user_id !== undefined) result.user_id = json.user_id

        return result
    }

    public modelEntityToModel(item: FitbitDeviceEntity): FitbitDevice {
        throw Error('Not implemented.')
    }

    public modelToModelEntity(item: FitbitDevice): FitbitDeviceEntity {
        const result: FitbitDeviceEntity = new FitbitDeviceEntity()

        if (item.id) result.id = item.id
        if (item.name) result.name = item.name
        if (item.address) result.address = item.address
        if (item.type) result.type = item.type
        if (item.last_sync) result.last_sync = item.last_sync
        if (item.manufacturer) result.manufacturer = item.manufacturer
        if (item.user_id) result.user_id = item.user_id

        return result
    }

    public transform(item: any): any {
        if (item instanceof FitbitDevice) return this.modelToModelEntity(item)
        return this.jsonToModel(item)
    }

}
