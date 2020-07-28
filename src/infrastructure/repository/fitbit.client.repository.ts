import FitbitApiClient from 'fitbit-node'
import { OAuthException } from '../../application/domain/exception/oauth.exception'
import { FitbitAuthData } from '../../application/domain/model/fitbit.auth.data'
import { injectable } from 'inversify'
import { IFitbitClientRepository } from '../../application/port/fitbit.client.repository.interface'
import { FitbitClientException } from '../../application/domain/exception/fitbit.client.exception'
import request from 'request'
import { Strings } from '../../utils/strings'

@injectable()
export class FitbitClientRepository implements IFitbitClientRepository {

    private fitbit_client: any
    private fitbit_api_host: string

    constructor() {
        this.fitbit_api_host = 'https://api.fitbit.com/1.2/user/-'
        this.fitbit_client = new FitbitApiClient({
            clientId: process.env.FITBIT_CLIENT_ID,
            clientSecret: process.env.FITBIT_CLIENT_SECRET,
            apiVersion: '1.2'
        })
    }

    public revokeToken(accessToken: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.fitbit_client.revokeAccessToken(accessToken)
                .then(res => resolve(!!res))
                .catch(err => reject(this.fitbitClientErrorListener(err, accessToken)))
        })
    }

    public refreshToken(accessToken: string, refreshToken: string, expiresIn?: number): Promise<any> {
        return new Promise<FitbitAuthData>(async (resolve, reject) => {
            this.fitbit_client.refreshAccessToken(accessToken, refreshToken, expiresIn)
                .then(tokenData => resolve(tokenData ? tokenData : undefined))
                .catch(err => reject(this.fitbitClientErrorListener(err, accessToken, refreshToken)))
        })
    }

    public getDataFromPath(path: string, accessToken: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            request({
                url: `${this.fitbit_api_host}${path}`,
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
                json: true
            }, (err, res, body) => {
                if (err) return reject(this.fitbitClientErrorListener(err))
                if (res.statusCode === 200) return resolve(body)
                return reject(this.fitbitAPIErrorListener(res.statusCode))
            })
        })
    }

    private fitbitAPIErrorListener(statusCode: number): any {
        return {
            400: () => new FitbitClientException('invalid_token', Strings.FITBIT_ERROR.INVALID_ACCESS_TOKEN),
            401: () => new FitbitClientException('invalid_token', Strings.FITBIT_ERROR.INVALID_ACCESS_TOKEN),
            403: () => new FitbitClientException('invalid_token', Strings.FITBIT_ERROR.INVALID_ACCESS_TOKEN),
            429: () => new FitbitClientException('system', Strings.FITBIT_ERROR.REQUEST_LIMIT_EXCEED),
            500: () => new FitbitClientException('internal_error', Strings.FITBIT_ERROR.INTERNAL_ERROR)
        }[statusCode]()
    }

    private fitbitClientErrorListener(err: any, accessToken?: string, refreshToken?: string): OAuthException |
        FitbitClientException | undefined {
        if (err.context) {
            return this.manageFitbitError({
                type: err.context.errors[0].errorType,
                message: err.context.errors[0].message
            }, accessToken, refreshToken)
        } else if (err.code === 'EAI_AGAIN') {
            return new FitbitClientException(
                'client_error',
                'Could not connect with the Fitbit Server',
                'Please try again later.')
        }
        return new OAuthException(err.errorType, err.message)
    }

    private manageFitbitError(err: any, accessToken?: string, refreshToken?: string): OAuthException |
        FitbitClientException | undefined {
        if (err.type === 'client_error') {
            return new FitbitClientException(
                'client_error',
                'Could not connect with the Fitbit Server',
                'Please try again later.')
        }
        if (err.type === 'expired_token') {
            return new FitbitClientException(
                'expired_token',
                'Access token expired.',
                `The access token ${accessToken} has been expired and needs to be refreshed.`)
        } else if (err.type === 'invalid_token') {
            return new FitbitClientException(
                'invalid_token',
                'Access token invalid.',
                `The access token ${accessToken} is invalid. Please make a new Fitbit Auth Data request and try again.`)
        } else if (err.type === 'invalid_grant') {
            return new FitbitClientException(
                'invalid_grant',
                'Refresh token invalid.',
                `The refresh token ${refreshToken} is invalid. Please make a new Fitbit Auth Data request and try again.`)
        } else if (err.type === 'system') {
            return new FitbitClientException(
                'system',
                `Data request limit for access token ${accessToken} has expired.`,
                'Please wait a minimum of one hour and try make the operation again.')
        } else if (err.type === 'invalid_client') {
            return new FitbitClientException(
                'invalid_client',
                'Invalid Fitbit Client data.',
                'The Fitbit Client credentials are invalid. The operation cannot be performed.')
        } else if (err.type === 'internal_error') {
            return new FitbitClientException('internal_error', 'A internal error occurs. Please, try again later.')
        }
        return new FitbitClientException(err.type, err.message)
    }

}
