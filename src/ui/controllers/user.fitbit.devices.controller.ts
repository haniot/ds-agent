import HttpStatus from 'http-status-codes'
import { controller, httpGet, request, response } from 'inversify-express-utils'
import { Request, Response } from 'express'
import { ApiExceptionManager } from '../exception/api.exception.manager'
import { inject } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { Device } from '../../application/domain/model/device'
import { IQuery } from '../../application/port/query.interface'
import { Query } from '../../infrastructure/repository/query/query'
import { IDeviceService } from '../../application/port/device.service.interface'

/**
 * Controller that implements User Fitbit Devices feature operations.
 *
 * @remarks To define paths, we use library inversify-express-utils.
 * @see {@link https://github.com/inversify/inversify-express-utils} for further information.
 */
@controller('/v1/users/:user_id/fitbit/devices')
export class UserFitbitDevicesController {
    constructor(
        @inject(Identifier.DEVICE_SERVICE) private readonly _deviceService: IDeviceService
    ) {
    }

    /**
     * Request the fitbit devices from user.
     *
     * @param {Request} req
     * @param {Response} res
     * @returns Promise<Response>
     */
    @httpGet('/')
    public async getFitbitDevices(@request() req: Request, @response() res: Response): Promise<Response> {
        try {
            const query: IQuery = new Query().fromJSON(req.query)
            query.addFilter({ patient_id: req.params.user_id })

            const result: Array<Device> = await this._deviceService.getAllByUser(req.params.user_id, query)

            const count: number = await this._deviceService.count(query)
            res.setHeader('x-total-count', count)

            return res.status(HttpStatus.OK).send(this.toJSONView(result))
        } catch (err) {
            const handlerError = ApiExceptionManager.build(err)
            return res.status(handlerError.code).send(handlerError.toJSON())
        }
    }

    private toJSONView(device: Array<Device>): any {
        return device.map(item => item.toJSON())
    }
}
