import { EventType, IntegrationEvent } from './integration.event'

export class FitbitRevokeEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date, public patientId?: string) {
        super('FitbitRevokeEvent', EventType.FITBIT, timestamp)
    }

    public toJSON(): any {
        if (!this.patientId) return {}
        return {
            ...super.toJSON(),
            fitbit: { patient_id: this.patientId }
        }
    }
}
