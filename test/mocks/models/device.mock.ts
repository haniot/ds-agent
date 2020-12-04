import { Device } from '../../../src/application/domain/model/device'
import { DefaultFunctions } from '../utils/default.functions'

export class DeviceMock {

    public generate(): Device {
        const device: Device = new Device()
        device.id = DefaultFunctions.generateObjectId()
        device.name = 'Default Device'
        device.address = '50CE1D793EC5'
        device.type = 'TRACKER'
        device.last_sync = DefaultFunctions.generateDate()
        device.manufacturer = 'Default Manufacturer'
        device.user_id = DefaultFunctions.generateObjectId()

        return device
    }
}
