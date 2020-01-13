import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'

export class TimeSeriesItem implements IJSONSerializable, IJSONDeserializable<TimeSeriesItem> {
    private _value?: number
    private _time?: string

    get value(): number | undefined {
        return this._value
    }

    set value(value: number | undefined) {
        this._value = value
    }

    get time(): string | undefined {
        return this._time
    }

    set time(value: string | undefined) {
        this._time = value
    }

    public fromJSON(json: any): TimeSeriesItem {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.value !== undefined) this.value = json.value
        if (json.time !== undefined) this.time = json.time

        return this
    }

    public toJSON(): any {
        return {
            value: this.value,
            time: this.time
        }
    }
}
