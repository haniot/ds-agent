import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'
import { HeartRateZone } from './heart.rate.zone'

export class TimeSeriesHeartRate implements IJSONSerializable, IJSONDeserializable<TimeSeriesHeartRate> {
    private _date?: string
    private _zones?: HeartRateZone

    get date(): string | undefined {
        return this._date
    }

    set date(value: string | undefined) {
        this._date = value
    }

    get zones(): HeartRateZone | undefined {
        return this._zones
    }

    set zones(value: HeartRateZone | undefined) {
        this._zones = value
    }

    public fromJSON(json: any): TimeSeriesHeartRate {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.patient_id !== undefined) this.date = json.patient_id
        if (json.zones !== undefined) this.zones = new HeartRateZone().fromJSON(json.zones)
        return this
    }

    public toJSON(): any {
        return {
            date: this.date,
            zones: this.zones ? this.zones.toJSON() : undefined
        }
    }
}
