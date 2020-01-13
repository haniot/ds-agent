import { IEntityMapper } from '../../port/entity.mapper.interface'
import { Weight } from '../../../application/domain/model/weight'
import { WeightEntity } from '../weight.entity'
import { injectable } from 'inversify'
import moment from 'moment'

@injectable()
export class WeightEntityMapper implements IEntityMapper<Weight, WeightEntity> {
    public jsonToModel(json: any): Weight {
        const result: Weight = new Weight()
        if (!json) return result

        if (json.date !== undefined && json.time !== undefined) {
            result.timestamp = moment(json.date.concat('T').concat(json.time)).utc().format()
        }
        if (json.weight !== undefined) result.value = json.weight
        if (json.fat !== undefined) result.body_fat = json.fat
        if (json.patient_id !== undefined) result.patient_id = json.patient_id
        result.unit = 'kg'
        return result
    }

    public modelEntityToModel(item: WeightEntity): Weight {
        throw Error('Not implemented.')
    }

    public modelToModelEntity(item: Weight): WeightEntity {
        throw Error('Not implemented.')
    }

    public transform(item: any): any {
        if (item instanceof Weight) return this.modelToModelEntity(item)
        return this.jsonToModel(item)
    }
}
