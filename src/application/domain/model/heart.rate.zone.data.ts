import { JsonUtils } from '../utils/json.utils'

export class HeartRateZoneData {
    private _min?: number // Minimum value of the heart rate zone.
    private _max?: number // Maximum value of the heart rate zone.
    private _duration?: number  // Duration in the heart rate zone (given in milliseconds).
    private _calories?: number // Burned calories in the heart rate zone.

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

    get duration(): number | undefined {
        return this._duration
    }

    set duration(value: number | undefined) {
        this._duration = value
    }

    get calories(): number | undefined {
        return this._calories
    }

    set calories(value: number | undefined) {
        this._calories = value
    }

    public fromJSON(json: any): HeartRateZoneData {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.min !== undefined) this.min = json.min
        if (json.max !== undefined) this.max = json.max
        if (json.duration !== undefined) this.duration = json.duration
        if (json.calories !== undefined) this.calories = json.calories

        return this
    }

    public toJSON(): any {
        return {
            min: this.min,
            max: this.max,
            duration: this.duration,
            calories: this.calories,
        }
    }
}
