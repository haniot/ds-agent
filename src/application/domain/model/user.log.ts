import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'
import { Log } from './log'

/**
 * Entity implementation of the child logs.
 *
 * @implements {IJSONSerializable, IJSONDeserializable<Log>}
 */
export class UserLog implements IJSONSerializable, IJSONDeserializable<UserLog> {
    private _steps!: Array<Log> // Logs of steps of a child
    private _calories!: Array<Log> // Logs of calories of a child
    private _active_minutes!: Array<Log> // Logs of active minutes of a child

    get steps(): Array<Log> {
        return this._steps
    }

    set steps(value: Array<Log>) {
        this._steps = value
    }

    get calories(): Array<Log> {
        return this._calories
    }

    set calories(value: Array<Log>) {
        this._calories = value
    }

    get active_minutes(): Array<Log> {
        return this._active_minutes
    }

    set active_minutes(value: Array<Log>) {
        this._active_minutes = value
    }

    public fromJSON(json: any): UserLog {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.steps !== undefined && json.steps instanceof Array) {
            this.steps = json.steps.map(steps => new Log().fromJSON(steps))
        }

        if (json.calories !== undefined && json.calories instanceof Array) {
            this.calories = json.calories.map(calories => new Log().fromJSON(calories))
        }

        if (json.active_minutes !== undefined && json.active_minutes instanceof Array) {
            this.active_minutes = json.active_minutes.map(activeMinutes => new Log().fromJSON(activeMinutes))
        }

        return this
    }

    public toJSON(): any {
        return {
            steps: this.steps ? this.steps.map(item => item.toJSON()) : this.steps,
            calories: this.calories ? this.calories.map(item => item.toJSON()) : this.calories,
            active_minutes: this.active_minutes ? this.active_minutes.map(item => item.toJSON()) : this.active_minutes
        }
    }

    public toJSONList(): Array<any> {
        return [
            ...this.steps ? this.steps.map(item => item.toJSON()) : [],
            ...this.calories ? this.calories.map(item => item.toJSON()) : [],
            ...this.active_minutes ? this.active_minutes.map(item => item.toJSON()) : []
        ]
    }
}
