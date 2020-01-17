import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'
import { PhysicalActivityLevel } from './physical.activity.level'
import { Activity } from './activity'
import { PhysicalActivityHeartRateZone } from './physical.activity.heart.rate.zone'

/**
 * Implementation of the physical physicalactivity entity.
 *
 * @extends {Entity}
 * @implements { IJSONSerializable, IJSONDeserializable<Activity>
 */
export class PhysicalActivity extends Activity implements IJSONSerializable, IJSONDeserializable<PhysicalActivity> {
    private _name?: string // Name of physical physicalactivity.
    private _calories?: number // Calories spent during physical physicalactivity.
    private _steps?: number // Number of steps taken during the physical physicalactivity.
    private _distance?: number // Distance traveled during physical activity in meters.
    private _levels?: Array<PhysicalActivityLevel> // PhysicalActivity levels (sedentary, light, fair or very).
    private _calories_link?: string // Link to calories resource
    private _heart_rate_link?: string // Link to Heart Rate resource
    private _heart_rate_average?: number // Average from Heart Rate in Physical Activity
    private _heart_rate_zones?: PhysicalActivityHeartRateZone // PhysicalActivity heart rate

    constructor() {
        super()
    }

    get name(): string | undefined {
        return this._name
    }

    set name(value: string | undefined) {
        this._name = value
    }

    get calories(): number | undefined {
        return this._calories
    }

    set calories(value: number | undefined) {
        this._calories = value
    }

    get steps(): number | undefined {
        return this._steps
    }

    set steps(value: number | undefined) {
        this._steps = value
    }

    get distance(): number | undefined {
        return this._distance
    }

    set distance(value: number | undefined) {
        this._distance = value
    }

    get levels(): Array<PhysicalActivityLevel> | undefined {
        return this._levels
    }

    set levels(value: Array<PhysicalActivityLevel> | undefined) {
        this._levels = value
    }

    get heart_rate_zones(): PhysicalActivityHeartRateZone | undefined {
        return this._heart_rate_zones
    }

    set heart_rate_zones(value: PhysicalActivityHeartRateZone | undefined) {
        this._heart_rate_zones = value
    }

    get calories_link(): string | undefined {
        return this._calories_link
    }

    set calories_link(value: string | undefined) {
        this._calories_link = value
    }

    get heart_rate_link(): string | undefined {
        return this._heart_rate_link
    }

    set heart_rate_link(value: string | undefined) {
        this._heart_rate_link = value
    }

    get heart_rate_average(): number | undefined {
        return this._heart_rate_average
    }

    set heart_rate_average(value: number | undefined) {
        this._heart_rate_average = value
    }

    public fromJSON(json: any): PhysicalActivity {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        super.fromJSON(json)
        if (json.name !== undefined) this.name = json.name
        if (json.calories !== undefined) this.calories = json.calories
        if (json.steps !== undefined) this.steps = json.steps
        if (json.distance !== undefined) this.distance = json.distance
        if (json.levels !== undefined && json.levels instanceof Array) {
            this.levels = json.levels.map(level => new PhysicalActivityLevel().fromJSON(level))
        }
        if (json.heart_rate_zones) this.heart_rate_zones = new PhysicalActivityHeartRateZone().fromJSON(json.heart_rate_zones)
        if (json.heart_rate_average !== undefined) this.heart_rate_average = json.heart_rate_average
        if (json.calories_link !== undefined) this.calories_link = json.calories_link
        if (json.heart_rate_link !== undefined) this.heart_rate_link = json.heart_rate_link

        return this
    }

    public toJSON(): any {
        return {
            ...super.toJSON(),
            ...{
                name: this.name,
                calories: this.calories,
                steps: this.steps,
                distance: this.distance,
                levels: this.levels ? this.levels.map(item => item.toJSON()) : this.levels,
                heart_rate_zones: this.heart_rate_zones ? this.heart_rate_zones.toJSON() : this.heart_rate_zones,
                heart_rate_average: this.heart_rate_average,
                calories_link: this.calories_link,
                heart_rate_link: this.heart_rate_link
            }
        }
    }
}
