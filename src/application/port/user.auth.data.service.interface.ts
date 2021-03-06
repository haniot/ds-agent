import { UserAuthData } from '../domain/model/user.auth.data'
import { IService } from './service.interface'
import { DataSync } from '../domain/model/data.sync'

export interface IUserAuthDataService extends IService<UserAuthData> {
    getByUserId(userId: string): Promise<UserAuthData | undefined>

    revokeFitbitAccessToken(userId: string): Promise<void>

    syncFitbitDataFromUser(userId: string): Promise<DataSync>
}
