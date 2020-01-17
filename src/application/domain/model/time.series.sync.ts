import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'

export class TimeSeriesSync implements IJSONSerializable, IJSONDeserializable<TimeSeriesSync> {
    private _steps?: number
    private _calories?: number
    private _distance?: number
    private _active_minutes?: number
    private _heart_rate?: number

    get steps(): number | undefined {
        return this._steps
    }

    set steps(value: number | undefined) {
        this._steps = value
    }

    get calories(): number | undefined {
        return this._calories
    }

    set calories(value: number | undefined) {
        this._calories = value
    }

    get distance(): number | undefined {
        return this._distance
    }

    set distance(value: number | undefined) {
        this._distance = value
    }

    get active_minutes(): number | undefined {
        return this._active_minutes
    }

    set active_minutes(value: number | undefined) {
        this._active_minutes = value
    }

    get heart_rate(): number | undefined {
        return this._heart_rate
    }

    set heart_rate(value: number | undefined) {
        this._heart_rate = value
    }

    public fromJSON(json: any): TimeSeriesSync {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.steps !== undefined) this.steps = json.steps
        if (json.calories !== undefined) this.calories = json.calories
        if (json.distance !== undefined) this.distance = json.distance
        if (json.active_minutes !== undefined) this.active_minutes = json.active_minutes
        if (json.heart_rate !== undefined) this.heart_rate = json.heart_rate

        return this
    }

    public toJSON(): any {
        return {
            steps: this.steps,
            calories: this.calories,
            distance: this.distance,
            active_minutes: this.active_minutes,
            heart_rate: this.heart_rate
        }
    }

}
