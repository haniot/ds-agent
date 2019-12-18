import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'

export class Item implements IJSONSerializable, IJSONDeserializable<Item> {
    private _date?: string
    private _value?: number

    get date(): string | undefined {
        return this._date
    }

    set date(value: string | undefined) {
        this._date = value
    }

    get value(): number | undefined {
        return this._value
    }

    set value(value: number | undefined) {
        this._value = value
    }

    public fromJSON(json: any): Item {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.date !== undefined) this.date = json.date
        if (json.value !== undefined) this.value = json.value

        return this
    }

    public toJSON(): any {
        return {
            date: this.date,
            value: this.value
        }
    }
}
