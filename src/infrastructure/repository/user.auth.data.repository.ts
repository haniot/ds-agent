import { IUserAuthDataRepository } from '../../application/port/user.auth.data.repository.interface'
import { UserAuthData } from '../../application/domain/model/user.auth.data'
import { BaseRepository } from './base/base.repository'
import { UserAuthDataEntity } from '../entity/user.auth.data.entity'
import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { IEntityMapper } from '../port/entity.mapper.interface'
import { ILogger } from '../../utils/custom.logger'
import { IQuery } from '../../application/port/query.interface'
import { Query } from './query/query'
import { IEventBus } from '../port/event.bus.interface'

@injectable()
export class UserAuthDataRepository extends BaseRepository<UserAuthData, UserAuthDataEntity>
    implements IUserAuthDataRepository {

    constructor(
        @inject(Identifier.USER_AUTH_REPO_MODEL) readonly _userAuthDataRepoModel: any,
        @inject(Identifier.USER_AUTH_DATA_ENTITY_MAPPER)
        readonly _userAuthEntityMapper: IEntityMapper<UserAuthData, UserAuthDataEntity>,
        @inject(Identifier.RABBITMQ_EVENT_BUS) readonly _eventBus: IEventBus,
        @inject(Identifier.LOGGER) readonly _logger: ILogger
    ) {
        super(_userAuthDataRepoModel, _userAuthEntityMapper, _logger)
    }

    public deleteByQuery(query: IQuery): Promise<boolean> {
        const q: any = query.toJSON()
        return new Promise<boolean>((resolve, reject) => {
            this.Model.findOneAndDelete(q.filters)
                .exec()
                .then((result) => resolve(!!result))
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public getUserAuthDataByUserId(userId: string): Promise<UserAuthData> {
        const q = new Query()
        q.filters = { user_id: userId }
        return new Promise<UserAuthData>((resolve, reject) => {
            this.Model.findOne(q.filters)
                .exec()
                .then(result => resolve(this._userAuthEntityMapper.transform(result)))
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }
}
