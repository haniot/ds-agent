import { DefaultEntityMock } from '../../mocks/models/default.entity.mock'
import { assert } from 'chai'
import { HeartRateZoneData } from '../../../src/application/domain/model/heart.rate.zone.data'

describe('Models: HeartRateZoneData', () => {
    describe('fromJSON()', () => {
        context('when convert a json into a model', () => {
            it('should return a model', () => {
                const res: HeartRateZoneData = new HeartRateZoneData().fromJSON(DefaultEntityMock.HEART_RATE_ZONE)
                assert.propertyVal(res, 'min', DefaultEntityMock.HEART_RATE_ZONE.min)
                assert.propertyVal(res, 'max', DefaultEntityMock.HEART_RATE_ZONE.max)
                assert.propertyVal(res, 'duration', DefaultEntityMock.HEART_RATE_ZONE.duration)
            })
        })
        context('when convert a json string into a model', () => {
            it('should return a model', () => {
                const res: HeartRateZoneData = new HeartRateZoneData().fromJSON(JSON.stringify(DefaultEntityMock.HEART_RATE_ZONE))
                assert.propertyVal(res, 'min', DefaultEntityMock.HEART_RATE_ZONE.min)
                assert.propertyVal(res, 'max', DefaultEntityMock.HEART_RATE_ZONE.max)
                assert.propertyVal(res, 'duration', DefaultEntityMock.HEART_RATE_ZONE.duration)
            })
        })
        context('when json is invalid', () => {
            it('should return undefined parameters for undefined json', () => {
                const res: HeartRateZoneData = new HeartRateZoneData().fromJSON(undefined)
                assert.propertyVal(res, 'min', undefined)
                assert.propertyVal(res, 'max', undefined)
                assert.propertyVal(res, 'duration', undefined)
            })
            it('should return undefined parameters for empty json', () => {
                const res: HeartRateZoneData = new HeartRateZoneData().fromJSON({})
                assert.propertyVal(res, 'min', undefined)
                assert.propertyVal(res, 'max', undefined)
                assert.propertyVal(res, 'duration', undefined)
            })
            it('should return undefined parameters for empty json string', () => {
                const res: HeartRateZoneData = new HeartRateZoneData().fromJSON('')
                assert.propertyVal(res, 'min', undefined)
                assert.propertyVal(res, 'max', undefined)
                assert.propertyVal(res, 'duration', undefined)
            })
            it('should return undefined parameters for invalid json string', () => {
                const res: HeartRateZoneData = new HeartRateZoneData().fromJSON('invalid')
                assert.propertyVal(res, 'min', undefined)
                assert.propertyVal(res, 'max', undefined)
                assert.propertyVal(res, 'duration', undefined)
            })
        })
    })

    describe('toJSON()', () => {
        context('when convert a model into a json', () => {
            it('should return a json', () => {
                const model: HeartRateZoneData = new HeartRateZoneData().fromJSON(DefaultEntityMock.HEART_RATE_ZONE)
                const res: any = model.toJSON()
                assert.deepEqual(res, DefaultEntityMock.HEART_RATE_ZONE)
            })
        })
        context('when the model parameters are undefined', () => {
            it('should return a json with undefined parameters', () => {
                const model: HeartRateZoneData = new HeartRateZoneData().fromJSON({})
                const res: any = model.toJSON()
                assert.propertyVal(res, 'min', undefined)
                assert.propertyVal(res, 'max', undefined)
                assert.propertyVal(res, 'duration', undefined)
            })
        })
    })
})
