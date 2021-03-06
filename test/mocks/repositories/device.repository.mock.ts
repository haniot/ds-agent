import { IFitbitDeviceRepository } from '../../../src/application/port/fitbit.device.repository.interface'
import { IQuery } from '../../../src/application/port/query.interface'
import { Device } from '../../../src/application/domain/model/device'
import { DefaultEntityMock } from '../models/default.entity.mock'

const data: Device = new Device().fromJSON(DefaultEntityMock.RESOURCE)

export class DeviceRepositoryMock implements IFitbitDeviceRepository {
    public create(item: Device): Promise<Device> {
        return Promise.resolve(item)
    }

    public find(query: IQuery): Promise<Array<Device>> {
        return Promise.resolve([data])
    }

    public findOne(query: IQuery): Promise<Device> {
        return Promise.resolve(data)
    }

    public update(item: Device): Promise<Device> {
        return Promise.resolve(item)
    }

    public delete(id: string): Promise<boolean> {
        return Promise.resolve(true)
    }

    public count(query: IQuery): Promise<number> {
        return Promise.resolve(1)
    }

    public syncAndParse(scopes: string[], token: string, userId: string): Promise<void> {
        return Promise.resolve()
    }

    public removeByQuery(query: IQuery): Promise<boolean> {
        return Promise.resolve(true)
    }

}
