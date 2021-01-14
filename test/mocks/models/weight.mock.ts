import { DefaultFunctions } from '../utils/default.functions'
import { Weight } from '../../../src/application/domain/model/weight'
import { MeasurementType } from '../../../src/application/domain/model/measurement'

export class WeightMock {

    public generate(): Weight {
        const weight: Weight = new Weight()

        weight.id = DefaultFunctions.generateObjectId()
        weight.type = MeasurementType.WEIGHT
        weight.timestamp = new Date(1560826800000 + Math.floor((Math.random() * 1000))).toISOString()
        weight.value = Math.random() * 16 + 50 // 50-65
        weight.unit = 'kg'
        weight.user_id = DefaultFunctions.generateObjectId()
        weight.body_fat = Math.random() * 10 + 20 // 20-29

        return weight
    }
}
