import FitbitApiClient from 'fitbit-node'
import { FitbitAuthData } from '../../application/domain/model/fitbit.auth.data'
import { inject, injectable } from 'inversify'
import { IFitbitClientRepository } from '../../application/port/fitbit.client.repository.interface'
import { FitbitClientException } from '../../application/domain/exception/fitbit.client.exception'
import request from 'request'
import { Strings } from '../../utils/strings'
import { Identifier } from '../../di/identifiers'
import { ILogger } from '../../utils/custom.logger'

@injectable()
export class FitbitClientRepository implements IFitbitClientRepository {

    private fitbit_client: any
    private readonly fitbit_api_host: string

    constructor(
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
        this.fitbit_api_host = 'https://api.fitbit.com'
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

    public getTokenIntrospect(token: string): Promise<boolean> {
        return new Promise<any>((resolve, reject) => {
            request({
                url: `${this.fitbit_api_host}/1.1/oauth2/introspect`,
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                form: { token },
                json: true
            }, (err, res, body) => {
                this._logger.debug(`getTokenIntrospect | error = ${err} | body = ${JSON.stringify(body)}`)
                return resolve(!!body?.active)
            })
        })
    }

    public getDataFromPath(path: string, accessToken: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            request({
                url: `${this.fitbit_api_host}/1.2/user/-${path}`,
                method: 'GET',
                headers: { Authorization: `Bearer ${accessToken}` },
                json: true
            }, (err, res, body) => {
                if (err) return reject(this.fitbitClientErrorListener(err, accessToken))
                if (res.statusCode === 200) return resolve(body)
                this._logger.debug(`Error getDataFromPath | path = ${path} | body = ${JSON.stringify(body)}`)
                return reject(this.fitbitAPIErrorListener(res.statusCode, accessToken))
            })
        })
    }

    private fitbitAPIErrorListener(statusCode: number, accessToken?: string): any {
        const errors = {
            401: () => new FitbitClientException(
                'invalid_token',
                Strings.FITBIT_ERROR.INVALID_ACCESS_TOKEN.replace(': {0}', accessToken ? `: ${accessToken}` : '')),
            429: () => new FitbitClientException(
                'system',
                Strings.FITBIT_ERROR.REQUEST_LIMIT_EXCEED),
            500: () => new FitbitClientException(
                'internal_error',
                Strings.FITBIT_ERROR.INTERNAL_ERROR)
        }
        return (errors[statusCode] || errors[500])()
    }

    private fitbitClientErrorListener(err: any, accessToken?: string, refreshToken?: string): FitbitClientException | undefined {
        if (err.context?.errors) {
            return this.manageFitbitError(
                { type: err.context.errors[0]?.errorType, message: err.context.errors[0]?.message },
                accessToken,
                refreshToken
            )
        } else if (err.code && err.code === 'EAI_AGAIN') {
            return new FitbitClientException(
                'client_error',
                'Could not connect with the Fitbit Server',
                'Please try again later.')
        }
        return new FitbitClientException('internal_error', Strings.FITBIT_ERROR.INTERNAL_ERROR)
    }

    private manageFitbitError(err: any, accessToken?: string, refreshToken?: string): FitbitClientException {
        const errors: any = {
            'client_error': () => new FitbitClientException(
                'client_error',
                'Could not connect with the Fitbit Server',
                'Please try again later.'),
            'expired_token': () => new FitbitClientException(
                'expired_token',
                'Access token expired.',
                `The access token ${accessToken} has been expired and needs to be refreshed.`),
            'invalid_token': () => new FitbitClientException(
                'invalid_token',
                'Access token invalid.',
                `The access token ${accessToken} is invalid. Please make a new Fitbit Auth Data request and try again.`),
            'invalid_grant': () => new FitbitClientException(
                'invalid_grant',
                'Refresh token invalid.',
                `The refresh token ${refreshToken} is invalid. Please make a new Fitbit Auth Data request and try again.`),
            'system': () => new FitbitClientException(
                'system',
                `Data request limit for access token ${accessToken} has expired.`,
                'Please wait a minimum of one hour and try make the operation again.'),
            'invalid_client': () => new FitbitClientException(
                'invalid_client',
                'Invalid Fitbit Client data.',
                'The Fitbit Client credentials are invalid. The operation cannot be performed.'),
            'internal_error': () => new FitbitClientException(
                'internal_error',
                'A internal error occurs. Please, try again later.')
        }
        return (errors[err.type] || errors.internal_error)()
    }

}
