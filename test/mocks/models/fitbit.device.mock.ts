import { FitbitDevice } from '../../../src/application/domain/model/fitbit.device'
import { DefaultFunctions } from '../utils/default.functions'

export class FitbitDeviceMock {

    public generate(): FitbitDevice {
        const fitbitDevice: FitbitDevice = new FitbitDevice()
        fitbitDevice.id = DefaultFunctions.generateObjectId()
        fitbitDevice.name = 'Default FitbitDevice'
        fitbitDevice.address = '50CE1D793EC5'
        fitbitDevice.type = 'TRACKER'
        fitbitDevice.last_sync = DefaultFunctions.generateDate()
        fitbitDevice.user_id = DefaultFunctions.generateObjectId()

        return fitbitDevice
    }
}
