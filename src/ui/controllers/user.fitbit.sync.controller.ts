import HttpStatus from 'http-status-codes'
import { controller, httpPost, request, response } from 'inversify-express-utils'
import { Request, Response } from 'express'
import { ApiExceptionManager } from '../exception/api.exception.manager'
import { inject } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { IUserAuthDataService } from '../../application/port/user.auth.data.service.interface'
import { DataSync } from '../../application/domain/model/data.sync'

/**
 * Controller that implements User Fitbit Sync feature operations.
 * @remarks
 * To define paths, we use library inversify-express-utils.
 *
 * @see {@link https://github.com/inversify/inversify-express-utils} for further information.
 */
@controller('/v1/users/:user_id/fitbit/sync')
export class UserFitbitSyncController {
    constructor(
        @inject(Identifier.USER_AUTH_DATA_SERVICE) private readonly _userAuthDataService: IUserAuthDataService
    ) {
    }

    /**
     * Request the data sync from user.
     *
     * @returns Promise<Response>
     */
    @httpPost('/')
    public async requestDataSync(@request() req: Request, @response() res: Response): Promise<Response> {
        try {
            const result: DataSync = await this._userAuthDataService.syncFitbitDataFromUser(req.params.user_id)
            return res.status(HttpStatus.CREATED).send(this.toJSONView(result))
        } catch (err: any) {
            if (err.code) {
                let status: number = HttpStatus.INTERNAL_SERVER_ERROR
                if ([1011, 1012, 1021].includes(err.code)) status = HttpStatus.BAD_REQUEST
                else if (err.code === 1401) status = HttpStatus.UNAUTHORIZED
                else if (err.code === 1429) status = HttpStatus.TOO_MANY_REQUESTS
                return res.status(status).send(err)
            }
            const handlerError = ApiExceptionManager.build(err)
            return res.status(handlerError.code).send(handlerError.toJSON())
        }
    }

    private toJSONView(item: DataSync): object {
        item.user_id = undefined
        return item.toJSON()
    }
}
