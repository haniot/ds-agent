import { Device } from '../../../src/application/domain/model/device'

export class DeviceMock {

    public generate(): Device {
        const device: Device = new Device()
        device.id = this.generateObjectId()
        device.name = 'Default Device'
        device.address = '50CE1D793EC5'
        device.type = 'TRACKER'
        device.last_sync = new Date().toISOString()
        device.manufacturer = 'Default Manufacturer'
        device.user_id = this.generateObjectId()

        return device
    }

    /**
     * Randomly generates a valid 24-byte hex ID.
     *
     * @return {string}
     */
    private generateObjectId(): string {
        const chars = 'abcdef0123456789'
        let randS = ''
        for (let i = 0; i < 24; i++) {
            randS += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return randS
    }
}
