import { UserAuthData } from '../../../src/application/domain/model/user.auth.data'
import { FitbitAuthDataMock } from './fitbit.auth.data.mock'
import { DefaultFunctions } from '../utils/default.functions'

export class UserAuthDataMock {

    public generate(): UserAuthData {
        const userAuthData: UserAuthData = new UserAuthData()
        userAuthData.id = DefaultFunctions.generateObjectId()
        userAuthData.updated_at = DefaultFunctions.generateDate()
        userAuthData.user_id = DefaultFunctions.generateObjectId()
        userAuthData.fitbit = new FitbitAuthDataMock().generate()

        return userAuthData
    }
}
