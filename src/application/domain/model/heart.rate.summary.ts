import { IJSONSerializable } from '../utils/json.serializable.interface'
import { IJSONDeserializable } from '../utils/json.deserializable.interface'
import { JsonUtils } from '../utils/json.utils'

export class HeartRateSummary implements IJSONSerializable, IJSONDeserializable<HeartRateSummary> {
    private _fat_burn_total?: number
    private _cardio_total?: number
    private _peak_total?: number
    private _out_of_range_total?: number

    get fat_burn_total(): number | undefined {
        return this._fat_burn_total
    }

    set fat_burn_total(value: number | undefined) {
        this._fat_burn_total = value
    }

    get cardio_total(): number | undefined {
        return this._cardio_total
    }

    set cardio_total(value: number | undefined) {
        this._cardio_total = value
    }

    get peak_total(): number | undefined {
        return this._peak_total
    }

    set peak_total(value: number | undefined) {
        this._peak_total = value
    }

    get out_of_range_total(): number | undefined {
        return this._out_of_range_total
    }

    set out_of_range_total(value: number | undefined) {
        this._out_of_range_total = value
    }

    public fromJSON(json: any): HeartRateSummary {
        if (!json) return this
        if (typeof json === 'string' && JsonUtils.isJsonString(json)) {
            json = JSON.parse(json)
        }

        if (json.fat_burn_total !== undefined) this.fat_burn_total = json.fat_burn_total
        if (json.cardio_total !== undefined) this.cardio_total = json.cardio_total
        if (json.peak_total !== undefined) this.peak_total = json.peak_total
        if (json.out_of_range_total !== undefined) this.out_of_range_total = json.out_of_range_total

        return this
    }

    public toJSON(): any {
        return {
            fat_burn_total: this.fat_burn_total,
            cardio_total: this.cardio_total,
            peak_total: this.peak_total,
            out_of_range_total: this.out_of_range_total
        }
    }

}
