import { IEntityMapper } from '../../port/entity.mapper.interface'
import { Device } from '../../../application/domain/model/device'
import { DeviceEntity } from '../device.entity'
import moment from 'moment'
import { injectable } from 'inversify'

@injectable()
export class DeviceEntityMapper implements IEntityMapper<Device, DeviceEntity> {
    public jsonToModel(json: any): Device {
        const result: Device = new Device()
        if (!json) return result

        if (json.id !== undefined) result.id = json.id
        result.name = json.deviceVersion || json.name
        result.address = json.mac || json.address
        if (json.type !== undefined) result.type = json.type
        result.last_sync =
            json.lastSyncTime !== undefined
                ? moment(json.lastSyncTime).utc().format(`YYYY-MM-DDTHH:mm:ss.SSS[Z]`)
                : json.last_sync
        if (json.patient_id !== undefined) result.patient_id = json.patient_id

        return result
    }

    public modelEntityToModel(item: DeviceEntity): Device {
        throw Error('Not implemented.')
    }

    public modelToModelEntity(item: Device): DeviceEntity {
        const result: DeviceEntity = new DeviceEntity()

        if (item.id) result.id = item.id
        if (item.name) result.name = item.name
        if (item.address) result.address = item.address
        if (item.type) result.type = item.type
        if (item.last_sync) result.last_sync = item.last_sync
        if (item.patient_id) result.patient_id = item.patient_id

        return result
    }

    public transform(item: any): any {
        if (item instanceof Device) return this.modelToModelEntity(item)
        return this.jsonToModel(item)
    }

}
