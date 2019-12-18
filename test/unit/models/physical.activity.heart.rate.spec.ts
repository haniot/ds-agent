import { DefaultEntityMock } from '../../mocks/models/default.entity.mock'
import { assert } from 'chai'
import { PhysicalActivityHeartRateZone } from '../../../src/application/domain/model/physical.activity.heart.rate.zone'
import { HeartRateZoneData } from '../../../src/application/domain/model/heart.rate.zone.data'

describe('Models: PhysicalActivityHeartRateZone', () => {
    describe('fromJSON()', () => {
        context('when convert a json into a model', () => {
            it('should return a model', () => {
                const res: PhysicalActivityHeartRateZone =
                    new PhysicalActivityHeartRateZone().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE)
                assert.propertyVal(res, 'average', DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.average)
                assert.deepPropertyVal(res, 'out_of_range_zone',
                    new HeartRateZoneData().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.out_of_range_zone))
                assert.deepPropertyVal(res, 'fat_burn_zone',
                    new HeartRateZoneData().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.fat_burn_zone))
                assert.deepPropertyVal(res, 'cardio_zone',
                    new HeartRateZoneData().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.cardio_zone))
                assert.deepPropertyVal(res, 'peak_zone',
                    new HeartRateZoneData().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.peak_zone))
            })
        })
        context('when convert a json string into a model', () => {
            it('should return a model', () => {
                const res: PhysicalActivityHeartRateZone = new PhysicalActivityHeartRateZone()
                    .fromJSON(JSON.stringify(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE))
                assert.propertyVal(res, 'average', DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.average)
                assert.deepPropertyVal(res, 'out_of_range_zone',
                    new HeartRateZoneData().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.out_of_range_zone))
                assert.deepPropertyVal(res, 'fat_burn_zone',
                    new HeartRateZoneData().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.fat_burn_zone))
                assert.deepPropertyVal(res, 'cardio_zone',
                    new HeartRateZoneData().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.cardio_zone))
                assert.deepPropertyVal(res, 'peak_zone',
                    new HeartRateZoneData().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE.peak_zone))
            })
        })
        context('when json is invalid', () => {
            it('should return undefined parameters for undefined json', () => {
                const res: PhysicalActivityHeartRateZone = new PhysicalActivityHeartRateZone().fromJSON(undefined)
                assert.propertyVal(res, 'average', undefined)
                assert.propertyVal(res, 'out_of_range_zone', undefined)
                assert.propertyVal(res, 'fat_burn_zone', undefined)
                assert.propertyVal(res, 'cardio_zone', undefined)
                assert.propertyVal(res, 'peak_zone', undefined)
            })
            it('should return undefined parameters for empty json', () => {
                const res: PhysicalActivityHeartRateZone = new PhysicalActivityHeartRateZone().fromJSON({})
                assert.propertyVal(res, 'average', undefined)
                assert.propertyVal(res, 'out_of_range_zone', undefined)
                assert.propertyVal(res, 'fat_burn_zone', undefined)
                assert.propertyVal(res, 'cardio_zone', undefined)
                assert.propertyVal(res, 'peak_zone', undefined)
            })
            it('should return undefined parameters for empty json string', () => {
                const res: PhysicalActivityHeartRateZone = new PhysicalActivityHeartRateZone().fromJSON('')
                assert.propertyVal(res, 'average', undefined)
                assert.propertyVal(res, 'out_of_range_zone', undefined)
                assert.propertyVal(res, 'fat_burn_zone', undefined)
                assert.propertyVal(res, 'cardio_zone', undefined)
                assert.propertyVal(res, 'peak_zone', undefined)
            })
            it('should return undefined parameters for invalid json string', () => {
                const res: PhysicalActivityHeartRateZone = new PhysicalActivityHeartRateZone().fromJSON('invalid')
                assert.propertyVal(res, 'average', undefined)
                assert.propertyVal(res, 'out_of_range_zone', undefined)
                assert.propertyVal(res, 'fat_burn_zone', undefined)
                assert.propertyVal(res, 'cardio_zone', undefined)
                assert.propertyVal(res, 'peak_zone', undefined)
            })
        })
    })

    describe('toJSON()', () => {
        context('when convert a model into a json', () => {
            it('should return a json', () => {
                const model: PhysicalActivityHeartRateZone =
                    new PhysicalActivityHeartRateZone().fromJSON(DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE)
                const res: any = model.toJSON()
                assert.deepEqual(res, DefaultEntityMock.PHYSICAL_ACTIVITY_HEART_RATE)
            })
        })
        context('when the model parameters are undefined', () => {
            it('should return a json with undefined parameters', () => {
                const model: PhysicalActivityHeartRateZone = new PhysicalActivityHeartRateZone().fromJSON({})
                const res: any = model.toJSON()
                assert.propertyVal(res, 'average', undefined)
                assert.propertyVal(res, 'out_of_range_zone', undefined)
                assert.propertyVal(res, 'fat_burn_zone', undefined)
                assert.propertyVal(res, 'cardio_zone', undefined)
                assert.propertyVal(res, 'peak_zone', undefined)
            })
        })
    })
})
