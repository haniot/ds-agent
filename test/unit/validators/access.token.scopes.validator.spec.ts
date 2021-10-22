import { assert } from 'chai'
import { DefaultEntityMock } from '../../mocks/models/default.entity.mock'
import { UserAuthData } from '../../../src/application/domain/model/user.auth.data'
import { AccessTokenScopesValidator } from '../../../src/application/domain/validator/access.token.scopes.validator'

describe('Validators: AccessTokenScopesValidator', () => {
    const item: UserAuthData = new UserAuthData().fromJSON(DefaultEntityMock.USER_AUTH_DATA)

    it('should return undefined when the validation was successful', () => {
        const result = AccessTokenScopesValidator.validate(item)
        assert.equal(result, undefined)
    })

    context('when there are validation errors', () => {
        it('should throw an error for does no pass access token', () => {
            item.user_id = undefined
            item.fitbit = undefined
            try {
                AccessTokenScopesValidator.validate(item)
            } catch (err: any) {
                assert.propertyVal(err, 'message',
                    'The token must have permission for at least one of the features that are synced by the API.')
                assert.propertyVal(err, 'description',
                    'The features that are mapped are: rwei (weight), ract (activity), rsle (sleep), rhr (heartrate).')
            }
        })

        it('should generate an error passing the scoping or invalid access token.', () => {
            try {
                const newItem: UserAuthData = new UserAuthData().fromJSON(DefaultEntityMock.USER_AUTH_DATA)
                newItem.fitbit!.scope = 'rpro'
                AccessTokenScopesValidator.validate(newItem)
            } catch (err: any) {
                assert.propertyVal(err, 'message',
                    'The token must have permission for at least one of the features that are synced by the API.')
                assert.propertyVal(err, 'description',
                    'The features that are mapped are: rwei (weight), ract (activity), rsle (sleep), rhr (heartrate).')
            }
        })
    })
})
