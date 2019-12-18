import { Entity } from './entity'
import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'

/**
 * Implementation of the physicalactivity entity.
 *
 * @extends {Entity}
 * @implements { IJSONSerializable, IJSONDeserializable<Activity>
 */
export class Activity extends Entity implements IJSONSerializable, IJSONDeserializable<Activity> {
    private _start_time?: string // PhysicalActivity start time according to the UTC.
    private _end_time?: string // PhysicalActivity end time according to the UTC.
    private _duration?: number // Total time in milliseconds spent in the activity.
    private _child_id!: string // Child ID belonging to activity.

    constructor() {
        super()
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

    get duration(): number | undefined {
        return this._duration
    }

    set duration(value: number | undefined) {
        this._duration = value
    }

    get child_id(): string {
        return this._child_id
    }

    set child_id(value: string) {
        this._child_id = value
    }

    public fromJSON(json: any): Activity {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.id !== undefined) super.id = json.id
        if (json.start_time !== undefined) this.start_time = json.start_time
        if (json.end_time !== undefined) this.end_time = json.end_time
        if (json.duration !== undefined) this.duration = json.duration
        if (json.child_id !== undefined) this.child_id = json.child_id

        return this
    }

    public toJSON(): any {
        return {
            id: super.id,
            start_time: this.start_time ? this.start_time : this.start_time,
            end_time: this.end_time ? this.end_time : this.end_time,
            duration: this.duration,
            child_id: this.child_id
        }
    }
}
