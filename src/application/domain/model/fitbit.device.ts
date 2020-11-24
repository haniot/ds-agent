import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { Device } from './device'
import { ManufacturerType } from '../utils/manufacturer.type'

/**
 * Implementation of the FitbitDevice entity.
 *
 * @extends {Entity}
 * @implements { IJSONSerializable, IJSONDeserializable<FitbitDevice>
 */
export class FitbitDevice extends Device implements IJSONSerializable, IJSONDeserializable<FitbitDevice> {
    constructor() {
        super()
        super.manufacturer = ManufacturerType.FITBIT
    }

    public fromJSON(json: any): FitbitDevice {
        if (!json) return this
        super.fromJSON(json)
        return this
    }

    public toJSON(): any {
        return super.toJSON()
    }
}
