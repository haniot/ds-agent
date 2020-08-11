import { DIContainer } from '../../../src/di/di'
import { Identifier } from '../../../src/di/identifiers'
import { App } from '../../../src/app'
import { expect } from 'chai'

const app: App = DIContainer.get(Identifier.APP)
const request = require('supertest')(app.getExpress())

describe('Routes: Home', () => {
    it('should return status code 200 for "GET /v1/reference/".', async () => {
        const endPoint = '/v1/reference/'
        const result = await request.get(endPoint)

        expect(result.statusCode).to.equal(200)
    })
})
