import { EventType, IntegrationEvent } from './integration.event'

export class TimeSeriesSyncEvent extends IntegrationEvent<any> {
    constructor(public timestamp?: Date,
                public patientId?: string,
                public stepsLogs?: Array<any>,
                public caloriesLogs?: Array<any>,
                public activeMinutesLogs?: Array<any>) {
        super('TimeSeriesSyncEvent', EventType.TIME_SERIES, timestamp)
    }

    public toJSON(): any {
        if (!this.patientId || !this.stepsLogs || !this.caloriesLogs || !this.activeMinutesLogs) return {}
        return [
            {
                patient_id: this.patientId,
                type: 'steps',
                data_set: this.stepsLogs.map(item => item.toJSON())
            },
            {
                patient_id: this.patientId,
                type: 'calories',
                data_set: this.caloriesLogs.map(item => item.toJSON())
            },
            {
                patient_id: this.patientId,
                type: 'active_minutes',
                data_set: this.activeMinutesLogs.map(item => item.toJSON())
            }
        ]
    }
}
