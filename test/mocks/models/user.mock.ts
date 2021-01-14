import { User } from '../../../src/application/domain/model/user'
import { DefaultFunctions } from '../utils/default.functions'

export class UserMock {

    public generate(): User {
        const user: User = new User()
        user.id = DefaultFunctions.generateObjectId()
        user.type = 'operator'

        return user
    }
}
