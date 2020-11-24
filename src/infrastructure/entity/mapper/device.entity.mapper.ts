import { IEntityMapper } from '../../port/entity.mapper.interface'
import { Device } from '../../../application/domain/model/device'
import { DeviceEntity } from '../device.entity'
import { injectable } from 'inversify'

@injectable()
export class DeviceEntityMapper implements IEntityMapper<Device, DeviceEntity> {
    public jsonToModel(json: any): Device {
        const result: Device = new Device()
        if (!json) return result

        if (json.id !== undefined) result.id = json.id
        if (json.name !== undefined) result.name = json.name
        if (json.address !== undefined) result.address = json.address
        if (json.type !== undefined) result.type = json.type
        if (json.last_sync !== undefined) result.last_sync = json.last_sync
        if (json.manufacturer !== undefined) result.manufacturer = json.manufacturer
        if (json.user_id !== undefined) result.user_id = json.user_id

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
        if (item.manufacturer) result.manufacturer = item.manufacturer
        if (item.user_id) result.user_id = item.user_id

        return result
    }

    public transform(item: any): any {
        if (item instanceof Device) return this.modelToModelEntity(item)
        return this.jsonToModel(item)
    }

}
