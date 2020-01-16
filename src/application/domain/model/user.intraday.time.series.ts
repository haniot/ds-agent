import { TimeSeries } from './time.series'
import { TimeSeriesHeartRate } from './time.series.heart.rate'
import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'
import { HeartRateZone } from './heart.rate.zone'
import { TimeSeriesItem } from './time.series.item'

export class UserIntradayTimeSeries implements IJSONSerializable, IJSONDeserializable<UserIntradayTimeSeries> {
    private _patient_id?: string
    private _start_time?: string
    private _end_time?: string
    private _interval?: string
    private _type?: string
    private _zones?: HeartRateZone
    private _data_set?: Array<TimeSeries | TimeSeriesHeartRate>

    get patient_id(): string | undefined {
        return this._patient_id
    }

    set patient_id(value: string | undefined) {
        this._patient_id = value
    }

    get start_time(): string | undefined {
        return this._start_time
    }

    set start_time(value: string | undefined) {
        this._start_time = value
    }

    get end_time(): string | undefined {
        return this._end_time
    }

    set end_time(value: string | undefined) {
        this._end_time = value
    }

    get interval(): string | undefined {
        return this._interval
    }

    set interval(value: string | undefined) {
        this._interval = value
    }

    get type(): string | undefined {
        return this._type
    }

    set type(value: string | undefined) {
        this._type = value
    }

    get zones(): HeartRateZone | undefined {
        return this._zones
    }

    set zones(value: HeartRateZone | undefined) {
        this._zones = value
    }

    get data_set(): Array<TimeSeries | TimeSeriesHeartRate> | undefined {
        return this._data_set
    }

    set data_set(value: Array<TimeSeries | TimeSeriesHeartRate> | undefined) {
        this._data_set = value
    }

    public fromJSON(json: any): UserIntradayTimeSeries {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.patient_id !== undefined) this.patient_id = json.patient_id
        if (json.start_time !== undefined) this.start_time = json.start_time
        if (json.end_time !== undefined) this.end_time = json.end_time
        if (json.interval !== undefined) this.interval = json.interval
        if (json.zones !== undefined) this.zones = new HeartRateZone().fromJSON(json.zones)
        if (json.type !== undefined) {
            this.type = json.type
        }
        if (json.data_set !== undefined && json.data_set instanceof Array) {
            this.data_set = json.data_set.map(item => new TimeSeriesItem().fromJSON(item))
        }

        return this
    }

    public toJSON(): any {
        return {
            patient_id: this.patient_id,
            start_time: this.start_time,
            end_time: this.end_time,
            interval: this.interval,
            type: this.type,
            zones: this.zones ? this.zones.toJSON() : undefined,
            data_set: this.data_set && this.data_set.length ? this.data_set.map(item => item.toJSON()) : []
        }
    }
}
