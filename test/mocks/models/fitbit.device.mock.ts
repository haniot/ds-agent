import { FitbitDevice } from '../../../src/application/domain/model/fitbit.device'

export class FitbitDeviceMock {

    public generate(): FitbitDevice {
        const fitbitDevice: FitbitDevice = new FitbitDevice()
        fitbitDevice.id = this.generateObjectId()
        fitbitDevice.name = 'Default FitbitDevice'
        fitbitDevice.address = '50CE1D793EC5'
        fitbitDevice.type = 'TRACKER'
        fitbitDevice.last_sync = new Date().toISOString()
        fitbitDevice.user_id = this.generateObjectId()

        return fitbitDevice
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
