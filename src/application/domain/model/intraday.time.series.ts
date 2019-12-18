import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { IntradaySummary } from './intraday.summary'
import { Item } from './item'
import { JsonUtils } from '../utils/json.utils'

export class IntradayTimeSeries implements IJSONSerializable, IJSONDeserializable<IntradayTimeSeries> {
    private _summary?: IntradaySummary
    private _data_set?: Array<Item>

    get summary(): IntradaySummary | undefined {
        return this._summary
    }

    set summary(value: IntradaySummary | undefined) {
        this._summary = value
    }

    get data_set(): Array<Item> | undefined {
        return this._data_set
    }

    set data_set(value: Array<Item> | undefined) {
        this._data_set = value
    }

    public fromJSON(json: any): IntradayTimeSeries {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.summary !== undefined) this.summary = json.summary
        if (json.data_set !== undefined) this.data_set = json.data_set.map(item => new Item().fromJSON(item))

        return this
    }

    public toJSON(): any {
        return {
            summary: this.summary,
            data_set: this.data_set && this.data_set.length ? this.data_set.map(item => item.toJSON()) : []
        }
    }

}
