import { FitbitAuthData } from '../model/fitbit.auth.data'
import { OAuthException } from '../exception/oauth.exception'

export class VerifyFitbitAuthValidator {
    public static validate(data: FitbitAuthData): void | OAuthException {
        if (data.status !== 'valid_token') {
            if (data.status === 'invalid_token') {
                throw new OAuthException(
                    'invalid_token',
                    `The access token is invalid: ${data.access_token}`,
                    'Please make a new Fitbit Auth data and try again.')
            }
            if (data.status === 'invalid_grant') {
                throw new OAuthException(
                    'invalid_grant',
                    `The refresh token is invalid: ${data.refresh_token}`,
                    'Please make a new Fitbit Auth data and try again.')
            }
        }
    }
}
