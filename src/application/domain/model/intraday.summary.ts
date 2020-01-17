import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'

export class IntradaySummary implements IJSONSerializable, IJSONDeserializable<IntradaySummary> {
    private _start_time?: string
    private _end_time?: string
    private _total ?: number
    private _interval?: string

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

    get total(): number | undefined {
        return this._total
    }

    set total(value: number | undefined) {
        this._total = value
    }

    get interval(): string | undefined {
        return this._interval
    }

    set interval(value: string | undefined) {
        this._interval = value
    }

    public fromJSON(json: any): IntradaySummary {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.start_time !== undefined) this.start_time = json.start_time
        if (json.end_time !== undefined) this.end_time = json.end_time
        if (json.total !== undefined) this.total = json.total
        if (json.interval !== undefined) this.interval = json.interval

        return this
    }

    public toJSON(): any {
        return {
            start_time: this.start_time,
            end_time: this.end_time,
            total: this.total,
            interval: this.interval
        }
    }
}
