import { Entity } from './entity'
import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'

/**
 * Implementation of the device entity.
 *
 * @extends {Entity}
 * @implements { IJSONSerializable, IJSONDeserializable<Device>
 */
export class Device extends Entity implements IJSONSerializable, IJSONDeserializable<Device> {
    private _name?: string // Device name identification field, according to factory default.
    private _address?: string // Unique combination of letters and numbers used to identify the device.
    private _type?: string // String representing the type of device, according with Fitbit patterns.
    private _last_sync?: string // Date of last device sync in Fitbit in UTC format, according to ISO 8601.
    private _patient_id!: string // Patient ID belonging to device.

    constructor() {
        super()
    }

    get name(): string | undefined {
        return this._name
    }

    set name(value: string | undefined) {
        this._name = value
    }

    get address(): string | undefined {
        return this._address
    }

    set address(value: string | undefined) {
        this._address = value
    }

    get type(): string | undefined {
        return this._type
    }

    set type(value: string | undefined) {
        this._type = value
    }

    get last_sync(): string | undefined {
        return this._last_sync
    }

    set last_sync(value: string | undefined) {
        this._last_sync = value
    }

    get patient_id(): string {
        return this._patient_id
    }

    set patient_id(value: string) {
        this._patient_id = value
    }

    public fromJSON(json: any): Device {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.id !== undefined) super.id = json.id
        if (json.name !== undefined) this.name = json.name
        if (json.address !== undefined) this.address = json.address
        if (json.type !== undefined) this.type = json.type
        if (json.last_sync !== undefined) this.last_sync = json.last_sync

        return this
    }

    public toJSON(): any {
        return {
            id: super.id,
            name: this.name,
            address: this.address,
            type: this.type,
            last_sync: this.last_sync,
            patient_id: this.patient_id
        }
    }
}
