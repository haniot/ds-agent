import { FitbitAuthData } from '../../../src/application/domain/model/fitbit.auth.data'
import { DefaultFunctions } from '../utils/default.functions'

export class FitbitAuthDataMock {

    public generate(): FitbitAuthData {
        const fitbitAuthData: FitbitAuthData = new FitbitAuthData()
        fitbitAuthData.id = DefaultFunctions.generateObjectId()
        fitbitAuthData.access_token = 'Access Token'
        fitbitAuthData.expires_in = 1605585418
        fitbitAuthData.refresh_token = 'Refresh Token'
        fitbitAuthData.scope = 'rwei rhr rset ract rsle'
        fitbitAuthData.token_type = 'Bearer'
        fitbitAuthData.user_id = 'USER_ID'
        fitbitAuthData.last_sync = DefaultFunctions.generateDate()
        fitbitAuthData.status = 'valid_token'

        return fitbitAuthData
    }
}
