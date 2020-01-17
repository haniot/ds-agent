import { EventType, IntegrationEvent } from './integration.event'

export class UserDeleteEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public user?: any) {
        super('UserDeleteEvent', EventType.USER, timestamp)
    }

    public toJSON(): any {
        if (!this.user) return {}
        return {
            ...super.toJSON(),
            user: this.user.toJSON()
        }
    }
}
