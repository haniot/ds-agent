import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'
import { TimeSeriesSync } from './time.series.sync'

export class DataSync implements IJSONSerializable, IJSONDeserializable<DataSync> {
    private _activities: number
    private _sleep: number
    private _weights: number
    private _intraday: TimeSeriesSync
    private _user_id?: string

    constructor() {
        this._activities = 0
        this._sleep = 0
        this._weights = 0
        this._intraday = new TimeSeriesSync()
    }

    get user_id(): string | undefined {
        return this._user_id
    }

    set user_id(value: string | undefined) {
        this._user_id = value
    }

    get activities(): number {
        return this._activities
    }

    set activities(value: number) {
        this._activities = value
    }

    get sleep(): number {
        return this._sleep
    }

    set sleep(value: number) {
        this._sleep = value
    }

    get weights(): number {
        return this._weights
    }

    set weights(value: number) {
        this._weights = value
    }

    get intraday(): TimeSeriesSync {
        return this._intraday
    }

    set intraday(value: TimeSeriesSync) {
        this._intraday = value
    }

    public fromJSON(json: any): DataSync {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.activities !== undefined) this.activities = json.activities
        if (json.sleep !== undefined) this.sleep = json.sleep
        if (json.weights !== undefined) this.weights = json.weights
        if (json.intraday !== undefined) this.intraday = new TimeSeriesSync().fromJSON(json.intraday)
        if (json.user_id !== undefined) this.user_id = json.user_id
        return this
    }

    public toJSON(): any {
        return {
            activities: this.activities,
            sleep: this.sleep,
            weights: this.weights,
            intraday: this.intraday ? this.intraday.toJSON() : undefined,
            user_id: this.user_id
        }
    }
}
