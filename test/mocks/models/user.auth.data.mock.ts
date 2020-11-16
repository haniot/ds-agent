import { UserAuthData } from '../../../src/application/domain/model/user.auth.data'
import { FitbitAuthDataMock } from './fitbit.auth.data.mock'

export class UserAuthDataMock {

    public generate(): UserAuthData {
        const userAuthData: UserAuthData = new UserAuthData()
        userAuthData.id = this.generateObjectId()
        userAuthData.updated_at = new Date().toISOString()
        userAuthData.user_id = this.generateObjectId()
        userAuthData.fitbit = new FitbitAuthDataMock().generate()

        return userAuthData
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
