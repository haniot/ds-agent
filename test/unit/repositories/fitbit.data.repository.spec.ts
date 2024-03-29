import { FitbitDataRepository } from '../../../src/infrastructure/repository/fitbit.data.repository'
import { IFitbitDataRepository } from '../../../src/application/port/fitbit.auth.data.repository.interface'
import { UserAuthRepoModel } from '../../../src/infrastructure/database/schema/oauth.data.schema'
import { EntityMapperMock } from '../../mocks/models/entity.mapper.mock'
import { FitbitClientRepositoryMock } from '../../mocks/repositories/fitbit.client.repository.mock'
import { EventBusRabbitMQMock } from '../../mocks/eventbus/eventbus.rabbitmq.mock'
import { CustomLoggerMock } from '../../mocks/custom.logger.mock'
import { ResourceRepositoryMock } from '../../mocks/repositories/resource.repository.mock'
import { DefaultEntityMock } from '../../mocks/models/default.entity.mock'
import { UserAuthData } from '../../../src/application/domain/model/user.auth.data'
import { assert } from 'chai'
import sinon from 'sinon'
import { DeviceRepositoryMock } from '../../mocks/repositories/device.repository.mock'

require('../../utils/sinon-mongoose')

describe('Repositories: FitbitDataRepository', () => {
    const data: UserAuthData = new UserAuthData().fromJSON(DefaultEntityMock.USER_AUTH_DATA)
    const modelFake: any = UserAuthRepoModel
    const repo: IFitbitDataRepository = new FitbitDataRepository(
        modelFake,
        new EntityMapperMock(),
        new EntityMapperMock(),
        new EntityMapperMock(),
        new EntityMapperMock(),
        new EntityMapperMock(),
        new FitbitClientRepositoryMock(),
        new ResourceRepositoryMock(),
        new DeviceRepositoryMock(),
        new EventBusRabbitMQMock(),
        new CustomLoggerMock()
    )

    afterEach(() => {
        sinon.restore()
    })

    describe('revokeToken()', () => {
        context('when revoke a access token', () => {
            it('should return true', () => {
                return repo.revokeToken(data.fitbit!.access_token!)
                    .then(res => {
                        assert.isTrue(res)
                    })
            })
        })
        context('when a error occurs', () => {
            it('should reject an error', () => {
                return repo.revokeToken('error')
                    .catch(err => {
                        assert.propertyVal(err, 'message', 'An error occurs!')
                    })
            })
        })
    })

    describe('refreshToken()', () => {
        context('when does not refresh a expired token', () => {
            it('should return undefined', () => {
                return repo.refreshToken('123', 'random', 'anything')
                    .then(res => {
                        assert.isUndefined(res)
                    })
            })
        })
        context('when a error occurs', () => {
            it('should reject an error', () => {
                return repo.refreshToken(data.user_id!, 'error', data.fitbit!.refresh_token!)
                    .catch(err => {
                        assert.propertyVal(err, 'message', 'An error occurs!')
                    })
            })
        })
    })


    describe('updateLastSync()', () => {
        context('when update the last data sync', () => {
            it('should return true', () => {
                sinon
                    .mock(modelFake)
                    .expects('findOneAndUpdate')
                    .withArgs(
                        { user_id: data.user_id },
                        { 'fitbit.last_sync': data.fitbit!.last_sync },
                        { new: true })
                    .resolves(data.fitbit!)

                return repo.updateLastSync(data.user_id!, data.fitbit!.last_sync!)
                    .then(res => {
                        assert.isTrue(res)
                    })
            })
        })
        context('when a database error occurs', () => {
            it('should return undefined', () => {
                const error: any = {
                    message: 'An internal error has occurred in the database!',
                    description: 'Please try again later...'
                }
                sinon
                    .mock(modelFake)
                    .expects('findOneAndUpdate')
                    .withArgs(
                        { user_id: data.user_id },
                        { 'fitbit.last_sync': data.fitbit!.last_sync },
                        { new: true })
                    .rejects(error)

                return repo.updateLastSync(data.user_id!, data.fitbit!.last_sync!)
                    .catch(err => {
                        assert.propertyVal(err, 'message', 'An internal error has occurred in the database!')
                        assert.propertyVal(err, 'description', 'Please try again later...')
                    })
            })
        })
    })

    describe('getTokenPayload()', () => {
        context('when get a token payload', () => {
            it('should return a payload as object', () => {
                return repo.getTokenPayload(DefaultEntityMock.FITBIT_AUTH_DATA.access_token)
                    .then(res => {
                        assert.deepEqual(res, DefaultEntityMock.PAYLOAD)
                    })
            })
        })
    })

    describe('publishLastSync()', () => {
        context('when publish a last sync date', () => {
            it('should return undefined', () => {
                const res = repo.publishLastSync(data.user_id!, data.fitbit!.last_sync!)
                assert.isUndefined(res)
            })
        })
        context('when an error occurs', () => {
            it('should return undefined', () => {
                const res = repo.publishLastSync(data.user_id!, 'error')
                assert.isUndefined(res)
            })
        })
    })

    describe('getTokenIntrospect()', () => {
        context('when the token is active', () => {
            it('should return a info from active token', async () => {
                const res = await repo.getTokenIntrospect('active')
                assert.deepPropertyVal(res, 'active', true)
            })
        })

        context('when the token is inactive', () => {
            it('should return a info from inactive token', async () => {
                const res = await repo.getTokenIntrospect('inactive')
                assert.deepPropertyVal(res, 'active', false)
            })
        })
    })
})
