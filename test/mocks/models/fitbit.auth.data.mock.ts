import { FitbitAuthData } from '../../../src/application/domain/model/fitbit.auth.data'

export class FitbitAuthDataMock {

    public generate(): FitbitAuthData {
        const fitbitAuthData: FitbitAuthData = new FitbitAuthData()
        fitbitAuthData.id = this.generateObjectId()
        fitbitAuthData.access_token = 'Access Token'
        fitbitAuthData.expires_in = 1605585418
        fitbitAuthData.refresh_token = 'Refresh Token'
        fitbitAuthData.scope = 'rwei rhr rset ract rsle'
        fitbitAuthData.token_type = 'Bearer'
        fitbitAuthData.user_id = 'USER_ID'
        fitbitAuthData.last_sync = new Date().toISOString()
        fitbitAuthData.status = 'valid_token'

        return fitbitAuthData
    }

    /**
     * Randomly generates a valid 24-byte hex ID.
     *
     * @return {string}
     */
    private generateObjectId(): string {
        const chars = 'abcdef0123456789'
        let randS = ''
        for (let i = 0; i < 24; i++) {
            randS += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return randS
    }
}
