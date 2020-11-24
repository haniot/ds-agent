/**
 * Implementation of generic entity.
 * Theoretically, the other entity must inherit it.
 *
 * @abstract
 */
export abstract class Entity {
    private _id?: string
    private _updated_at?: string

    protected constructor(id?: string, updated_at?: string) {
        this.id = id
        this.updated_at = updated_at
    }

    get id(): string | undefined {
        return this._id
    }

    set id(value: string | undefined) {
        this._id = value
    }

    get updated_at(): string | undefined {
        return this._updated_at
    }

    set updated_at(value: string | undefined) {
        this._updated_at = value
    }
}
