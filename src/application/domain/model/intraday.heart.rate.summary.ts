import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'
import { PhysicalActivityHeartRateZone } from './physical.activity.heart.rate.zone'

export class IntradayHeartRateSummary implements IJSONSerializable, IJSONDeserializable<IntradayHeartRateSummary> {
    private _start_time?: string
    private _end_time?: string
    private _min?: number
    private _max?: number
    private _average?: number
    private _interval?: string
    private _zones?: Array<PhysicalActivityHeartRateZone>

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

    get min(): number | undefined {
        return this._min
    }

    set min(value: number | undefined) {
        this._min = value
    }

    get max(): number | undefined {
        return this._max
    }

    set max(value: number | undefined) {
        this._max = value
    }

    get average(): number | undefined {
        return this._average
    }

    set average(value: number | undefined) {
        this._average = value
    }

    get interval(): string | undefined {
        return this._interval
    }

    set interval(value: string | undefined) {
        this._interval = value
    }

    get zones(): Array<PhysicalActivityHeartRateZone> | undefined {
        return this._zones
    }

    set zones(value: Array<PhysicalActivityHeartRateZone> | undefined) {
        this._zones = value
    }

    public fromJSON(json: any): IntradayHeartRateSummary {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.start_time !== undefined) this.start_time = json.start_time
        if (json.end_time !== undefined) this.end_time = json.end_time
        if (json.min !== undefined) this.min = json.min
        if (json.max !== undefined) this.max = json.max
        if (json.average !== undefined) this.average = json.average
        if (json.interval !== undefined) this.interval = json.interval
        if (json.zones !== undefined && json.zones instanceof Array) {
            this.zones = json.zones.map(item => new PhysicalActivityHeartRateZone().fromJSON(item))
        }

        return this
    }

    public toJSON(): any {
        return {
            start_time: this.start_time,
            end_time: this.end_time,
            min: this.min,
            max: this.max,
            average: this.average,
            interval: this.interval,
            zones: this.zones && this.zones.length ? this.zones.map(item => item.toJSON()) : []
        }
    }
}
