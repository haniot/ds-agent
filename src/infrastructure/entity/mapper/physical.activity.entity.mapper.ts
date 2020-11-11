import { IEntityMapper } from '../../port/entity.mapper.interface'
import { PhysicalActivity } from '../../../application/domain/model/physical.activity'
import { PhysicalActivityEntity } from '../physical.activity.entity'
import moment from 'moment'
import { PhysicalActivityLevel } from '../../../application/domain/model/physical.activity.level'
import { PhysicalActivityHeartRateZone } from '../../../application/domain/model/physical.activity.heart.rate.zone'
import { injectable } from 'inversify'

@injectable()
export class PhysicalActivityEntityMapper implements IEntityMapper<PhysicalActivity, PhysicalActivityEntity> {
    public jsonToModel(json: any): PhysicalActivity {
        const result: PhysicalActivity = new PhysicalActivity()
        if (!json) return result

        if (json.startTime !== undefined) {
            result.start_time = moment(json.startTime).utc().format()
            result.end_time = moment(json.startTime).add(json.duration, 'milliseconds').utc().format()
        }
        if (json.duration !== undefined) result.duration = json.duration
        if (json.activityName !== undefined) result.name = json.activityName
        if (json.calories !== undefined) result.calories = json.calories
        if (json.caloriesLink !== undefined) result.calories_link = json.caloriesLink
        if (json.patient_id !== undefined) result.patient_id = json.patient_id
        if (json.heartRateLink !== undefined) result.heart_rate_link = json.heartRateLink
        if (json.steps !== undefined) result.steps = json.steps
        if (json.distance !== undefined && json.distanceUnit !== undefined) {
            result.distance = this.convertDistanceToMetter(json.distance, json.distanceUnit)
        }
        if (json.activityLevel !== undefined && json.activityLevel.length) {
            result.levels = json.activityLevel.map(level => new PhysicalActivityLevel().fromJSON({
                duration: level.minutes * 60000,
                name: level.name
            }))
        }
        if (json.averageHeartRate !== undefined) {
            result.heart_rate_average = json.averageHeartRate
            if (json.heartRateZones !== undefined) {
                const peak: any = json.heartRateZones.find(zone => zone.name === 'Peak')
                const out_of_range: any = json.heartRateZones.find(zone => zone.name === 'Out of Range')
                const cardio: any = json.heartRateZones.find(zone => zone.name === 'Cardio')
                const fat_burn: any = json.heartRateZones.find(zone => zone.name === 'Fat Burn')


                peak.duration = peak.minutes * 60000
                out_of_range.duration = out_of_range.minutes * 60000
                cardio.duration = cardio.minutes * 60000
                fat_burn.duration = fat_burn.minutes * 60000

                result.heart_rate_zones = new PhysicalActivityHeartRateZone().fromJSON({
                    peak, out_of_range, cardio, fat_burn
                })
            }
        }
        return result
    }

    private convertDistanceToMetter(distance: number, unit: string): number {
        return unit === 'Kilometer' ? Math.round(distance * 1000) : Math.round(distance * 1609.344)
    }

    public modelEntityToModel(item: PhysicalActivityEntity): PhysicalActivity {
        throw Error('Not implemented.')
    }

    public modelToModelEntity(item: PhysicalActivity): PhysicalActivityEntity {
        throw Error('Not implemented.')
    }

    public transform(item: any): any {
        if (item instanceof PhysicalActivity) return this.modelToModelEntity(item)
        return this.jsonToModel(item)
    }

}
