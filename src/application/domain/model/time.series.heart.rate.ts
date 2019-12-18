import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { HeartRateSummary } from './heart.rate.summary'
import { Item } from './item'
import { JsonUtils } from '../utils/json.utils'

export class TimeSeriesHeartRate implements IJSONSerializable, IJSONDeserializable<TimeSeriesHeartRate> {
    private _summary?: HeartRateSummary
    private _data_set?: Array<Item>

    get summary(): HeartRateSummary | undefined {
        return this._summary
    }

    set summary(value: HeartRateSummary | undefined) {
        this._summary = value
    }

    get data_set(): Array<Item> | undefined {
        return this._data_set
    }

    set data_set(value: Array<Item> | undefined) {
        this._data_set = value
    }

    public fromJSON(json: any): TimeSeriesHeartRate {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.summary !== undefined) this.summary = new HeartRateSummary().fromJSON(json.summary)
        if (json.data_set !== undefined) this.data_set = json.data_set.map(item => new Item().fromJSON(item))
        return this
    }

    public toJSON(): any {
        return {
            summary: this.summary ? this.summary.toJSON() : undefined,
            data_set: this.data_set && this.data_set.length ? this.data_set.map(item => item.toJSON()) : []
        }
    }
}
