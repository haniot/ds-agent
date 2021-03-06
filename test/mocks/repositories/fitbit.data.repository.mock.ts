import { IFitbitDataRepository } from '../../../src/application/port/fitbit.auth.data.repository.interface'
import { FitbitAuthData } from '../../../src/application/domain/model/fitbit.auth.data'
import { DefaultEntityMock } from '../models/default.entity.mock'
import { DataSync } from '../../../src/application/domain/model/data.sync'
import { FitbitClientException } from '../../../src/application/domain/exception/fitbit.client.exception'

const authData: FitbitAuthData = new FitbitAuthData().fromJSON(DefaultEntityMock.FITBIT_AUTH_DATA)
const dataSync: DataSync = new DataSync().fromJSON(DefaultEntityMock.DATA_SYNC)

export class FitbitDataRepositoryMock implements IFitbitDataRepository {
    public removeFitbitAuthData(userId: string): Promise<boolean> {
        return Promise.resolve(true)
    }

    public getTokenPayload(token: string): Promise<any> {
        return Promise.resolve(DefaultEntityMock.PAYLOAD)
    }

    public refreshToken(userId: string, accessToken: string, refreshToken: string, expiresIn?: number):
        Promise<FitbitAuthData> {
        return Promise.resolve(authData)
    }

    public revokeToken(accessToken: string): Promise<boolean> {
        return Promise.resolve(true)
    }

    public subscribeUserEvent(data: FitbitAuthData, resource: string, subscriptionId: string): Promise<void> {
        return Promise.resolve()
    }

    public syncLastFitbitUserData(data: FitbitAuthData, userId: string, type: string, date: string, calls: number):
        Promise<void> {
        return Promise.resolve()
    }

    public unsubscribeUserEvent(data: FitbitAuthData, resource: string, subscriptionId: string): Promise<void> {
        return Promise.resolve()
    }

    public updateLastSync(userId: string, lastSync: string): Promise<boolean> {
        return Promise.resolve(true)
    }

    public publishLastSync(userId: string, lastSync: string): void {
        return
    }

    public syncFitbitData(data: FitbitAuthData, userId: string): Promise<DataSync> {
        if (userId === DefaultEntityMock.USER_IDS.expired_token) {
            return Promise.reject(new FitbitClientException('expired_token', 'The token has expired'))
        } else if (userId === DefaultEntityMock.USER_IDS.invalid_token) {
            return Promise.reject(new FitbitClientException('invalid_token', 'The token is invalid'))
        } else if (userId === DefaultEntityMock.USER_IDS.client_error) {
            return Promise.reject(new FitbitClientException('client_error', 'The Fitbit Client is unavailable'))
        } else if (userId === DefaultEntityMock.USER_IDS.any_fitbit_error) {
            return Promise.reject(new Error('Any error occurs'))
        }
        return Promise.resolve(dataSync)
    }

    public updateTokenStatus(userId: string, status: string): Promise<boolean> {
        return Promise.resolve(true)
    }

    public getTokenIntrospect(token: string): Promise<any> {
        return Promise.resolve({ active: true })
    }

}
