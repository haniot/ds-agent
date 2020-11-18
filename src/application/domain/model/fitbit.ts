import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'
import { IJSONSerializable } from '../utils/json.serializable.interface'

export class Fitbit implements IJSONSerializable, IJSONDeserializable<Fitbit> {
    private _user_id?: string
    private _last_sync?: string
    private _error?: any
    private _timestamp?: string

    get user_id(): string | undefined {
        return this._user_id
    }

    set user_id(value: string | undefined) {
        this._user_id = value
    }

    get last_sync(): string | undefined {
        return this._last_sync
    }

    set last_sync(value: string | undefined) {
        this._last_sync = value
    }

    get error(): any {
        return this._error
    }

    set error(value: any) {
        this._error = value
    }

    get timestamp(): string | undefined {
        return this._timestamp
    }

    set timestamp(value: string | undefined) {
        this._timestamp = value
    }

    public fromJSON(json: any): Fitbit {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.user_id) this.user_id = json.user_id
        if (json.last_sync) this.last_sync = json.last_sync
        if (json.error) this.error = json.error
        if (json.timestamp) this.timestamp = json.timestamp

        return this
    }

    public toJSON(): any {
        return {
            user_id: this.user_id,
            last_sync: this.last_sync,
            error: this.error,
            timestamp: this.timestamp
        }
    }
}
