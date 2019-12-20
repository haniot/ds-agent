import { TimeSeries } from './time.series'
import { TimeSeriesHeartRate } from './time.series.heart.rate'
import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'
import { Item } from './item'

export class UserTimeSeries implements IJSONSerializable, IJSONDeserializable<UserTimeSeries> {
    private _patient_id?: string
    private _type?: string
    private _data_set?: Array<TimeSeries | TimeSeriesHeartRate>

    get patient_id(): string | undefined {
        return this._patient_id
    }

    set patient_id(value: string | undefined) {
        this._patient_id = value
    }

    get type(): string | undefined {
        return this._type
    }

    set type(value: string | undefined) {
        this._type = value
    }

    get data_set(): Array<TimeSeries | TimeSeriesHeartRate> | undefined {
        return this._data_set
    }

    set data_set(value: Array<TimeSeries | TimeSeriesHeartRate> | undefined) {
        this._data_set = value
    }

    public fromJSON(json: any): UserTimeSeries {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.patient_id !== undefined) this.patient_id = json.patient_id
        if (json.type !== undefined) {
            this.type = json.type
            if (json.data_set !== undefined && json.data_set instanceof Array) {
                this.data_set = json.data_set.map(item => {
                    return json.type === 'heart_rate' ?
                        new TimeSeriesHeartRate().fromJSON(item) : new Item().fromJSON(item)
                })
            }
        }

        return this
    }

    public toJSON(): any {
        return {
            patient_id: this.patient_id,
            type: this.type,
            data_set: this.data_set && this.data_set.length ? this.data_set.map(item => item.toJSON()) : []
        }
    }
}
