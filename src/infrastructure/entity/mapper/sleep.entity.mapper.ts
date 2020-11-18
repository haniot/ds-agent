import { IEntityMapper } from '../../port/entity.mapper.interface'
import { SleepEntity } from '../sleep.entity'
import { Sleep } from '../../../application/domain/model/sleep'
import moment from 'moment'
import { SleepPattern } from '../../../application/domain/model/sleep.pattern'
import { injectable } from 'inversify'

@injectable()
export class SleepEntityMapper implements IEntityMapper<Sleep, SleepEntity> {
    public jsonToModel(json: any): Sleep {
        const result: Sleep = new Sleep()
        if (!json) return result

        if (json.startTime !== undefined) {
            result.start_time = moment(json.startTime).utc().format()
            if (json.duration !== undefined) {
                result.end_time = moment(json.startTime).add(json.duration, 'milliseconds').utc().format()
                result.duration = json.duration
            }
        }
        if (json.type !== undefined) result.type = json.type
        if (json.levels && json.levels.data && json.levels.data.length) {
            result.pattern = new SleepPattern().fromJSON({
                data_set: json.levels.data.map(value => {
                    return {
                        start_time: moment(value.dateTime).utc().format(),
                        name: value.level,
                        duration: `${parseInt(value.seconds, 10) * 1000}`
                    }
                }),
                summary: this.getSleepSummary(json.levels.summary)
            })
        }
        if (json.user_id !== undefined) result.user_id = json.user_id
        return result
    }

    public modelEntityToModel(item: SleepEntity): Sleep {
        throw new Error('')
    }

    public modelToModelEntity(item: Sleep): SleepEntity {
        throw new Error('')
    }

    public transform(item: any): any {
        if (item instanceof Sleep) return this.modelToModelEntity(item)
        return this.jsonToModel(item)
    }

    private getSleepSummary(summary: any): any {
        if (summary.asleep && summary.awake && summary.restless) {
            return {
                asleep: { count: summary.asleep.count, duration: summary.asleep.minutes * 60000 },
                awake: { count: summary.awake.count, duration: summary.awake.minutes * 60000 },
                restless: { count: summary.restless.count, duration: summary.restless.minutes * 60000 }
            }
        }
        return {
            deep: { count: summary.deep.count, duration: summary.deep.minutes * 60000 },
            light: { count: summary.light.count, duration: summary.light.minutes * 60000 },
            rem: { count: summary.rem.count, duration: summary.rem.minutes * 60000 },
            wake: { count: summary.wake.count, duration: summary.wake.minutes * 60000 }
        }
    }
}
