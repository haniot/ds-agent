import 'reflect-metadata'
import { Container } from 'inversify'
import { HomeController } from '../ui/controllers/home.controller'
import { Identifier } from './identifiers'
import { IConnectionFactory } from '../infrastructure/port/connection.factory.interface'
import { BackgroundService } from '../background/background.service'
import { App } from '../app'
import { CustomLogger, ILogger } from '../utils/custom.logger'
import { ConnectionFactoryRabbitMQ } from '../infrastructure/eventbus/rabbitmq/connection.factory.rabbitmq'
import { UserFitbitAuthController } from '../ui/controllers/user.fitbit.auth.controller'
import { UserFitbitSyncController } from '../ui/controllers/user.fitbit.sync.controller'
import { UserAuthRepoModel } from '../infrastructure/database/schema/oauth.data.schema'
import { FitbitAuthData } from '../application/domain/model/fitbit.auth.data'
import { FitbitAuthDataEntity } from '../infrastructure/entity/fitbit.auth.data.entity'
import { UserAuthDataEntityMapper } from '../infrastructure/entity/mapper/user.auth.data.entity.mapper'
import { IEntityMapper } from '../infrastructure/port/entity.mapper.interface'
import { UserAuthDataService } from '../application/service/user.auth.data.service'
import { IBackgroundTask } from '../application/port/background.task.interface'
import { SyncFitbitDataTask } from '../background/task/sync.fitbit.data.task'
import { FitbitSubscriberController } from '../ui/controllers/fitbit.subscriber.controller'
import { FitbitAuthDataEntityMapper } from '../infrastructure/entity/mapper/fitbit.auth.data.entity.mapper'
import { UserAuthData } from '../application/domain/model/user.auth.data'
import { UserAuthDataEntity } from '../infrastructure/entity/user.auth.data.entity'
import { IUserAuthDataRepository } from '../application/port/user.auth.data.repository.interface'
import { UserAuthDataRepository } from '../infrastructure/repository/user.auth.data.repository'
import { IFitbitDataRepository } from '../application/port/fitbit.auth.data.repository.interface'
import { FitbitDataRepository } from '../infrastructure/repository/fitbit.data.repository'
import { FitbitController } from '../ui/controllers/fitbit.controller'
import { FitbitClientRepository } from '../infrastructure/repository/fitbit.client.repository'
import { IFitbitClientRepository } from '../application/port/fitbit.client.repository.interface'
import { IUserAuthDataService } from '../application/port/user.auth.data.service.interface'
import { ResourceRepoModel } from '../infrastructure/database/schema/resource.schema'
import { Resource } from '../application/domain/model/resource'
import { ResourceEntity } from '../infrastructure/entity/resource.entity'
import { ResourceEntityMapper } from '../infrastructure/entity/mapper/resource.entity.mapper'
import { IResourceRepository } from '../application/port/resource.repository.interface'
import { ResourceRepository } from '../infrastructure/repository/resource.repository'
import { ConnectionMongodb } from '../infrastructure/database/connection.mongodb'
import { SubscribeEventBusTask } from '../background/task/subscribe.event.bus.task'
import { ConnectionFactoryMongodb } from '../infrastructure/database/connection.factory.mongodb'
import { IConnectionDB } from '../infrastructure/port/connection.db.interface'
import { IConnectionEventBus } from '../infrastructure/port/connection.event.bus.interface'
import { ConnectionRabbitMQ } from '../infrastructure/eventbus/rabbitmq/connection.rabbitmq'
import { IEventBus } from '../infrastructure/port/event.bus.interface'
import { EventBusRabbitMQ } from '../infrastructure/eventbus/rabbitmq/eventbus.rabbitmq'
import { Sleep } from '../application/domain/model/sleep'
import { SleepEntity } from '../infrastructure/entity/sleep.entity'
import { SleepEntityMapper } from '../infrastructure/entity/mapper/sleep.entity.mapper'
import { PhysicalActivity } from '../application/domain/model/physical.activity'
import { PhysicalActivityEntity } from '../infrastructure/entity/physical.activity.entity'
import { PhysicalActivityEntityMapper } from '../infrastructure/entity/mapper/physical.activity.entity.mapper'
import { Weight } from '../application/domain/model/weight'
import { WeightEntity } from '../infrastructure/entity/weight.entity'
import { WeightEntityMapper } from '../infrastructure/entity/mapper/weight.entity.mapper'

class IoC {
    private readonly _container: Container

    /**
     * Creates an instance of Di.
     *
     * @private
     */
    constructor() {
        this._container = new Container()
        this.initDependencies()
    }

    /**
     * Get Container inversify.
     *
     * @returns {Container}
     */
    get container(): Container {
        return this._container
    }

    /**
     * Initializes injectable containers.
     *
     * @private
     * @return void
     */
    private initDependencies(): void {
        this._container.bind(Identifier.APP).to(App).inSingletonScope()

        // Controllers
        this._container.bind<HomeController>(Identifier.HOME_CONTROLLER).to(HomeController).inSingletonScope()
        this._container.bind<FitbitController>(Identifier.FITBIT_CONTROLLER).to(FitbitController).inSingletonScope()
        this._container.bind<FitbitSubscriberController>(Identifier.FITBIT_SUBSCRIBER_CONTROLLER)
            .to(FitbitSubscriberController).inSingletonScope()
        this._container.bind<UserFitbitAuthController>(Identifier.USER_FITBIT_AUTH_CONTROLLER)
            .to(UserFitbitAuthController).inSingletonScope()
        this._container.bind<UserFitbitSyncController>(Identifier.USER_FITBIT_SYNC_CONTROLLER)
            .to(UserFitbitSyncController).inSingletonScope()

        // Services
        this.container.bind<IUserAuthDataService>(Identifier.USER_AUTH_DATA_SERVICE)
            .to(UserAuthDataService).inSingletonScope()

        // Repositories
        this._container
            .bind<IFitbitDataRepository>(Identifier.FITBIT_DATA_REPOSITORY)
            .to(FitbitDataRepository).inSingletonScope()
        this._container
            .bind<IUserAuthDataRepository>(Identifier.USER_AUTH_DATA_REPOSITORY)
            .to(UserAuthDataRepository).inSingletonScope()
        this._container
            .bind<IFitbitClientRepository>(Identifier.FITBIT_CLIENT_REPOSITORY)
            .to(FitbitClientRepository).inSingletonScope()
        this._container
            .bind<IResourceRepository>(Identifier.RESOURCE_REPOSITORY)
            .to(ResourceRepository).inSingletonScope()

        // Models
        this._container.bind(Identifier.USER_AUTH_REPO_MODEL).toConstantValue(UserAuthRepoModel)
        this._container.bind(Identifier.RESOURCE_REPO_MODEL).toConstantValue(ResourceRepoModel)

        // Mappers
        this.container
            .bind<IEntityMapper<UserAuthData, UserAuthDataEntity>>(Identifier.USER_AUTH_DATA_ENTITY_MAPPER)
            .to(UserAuthDataEntityMapper).inSingletonScope()
        this.container
            .bind<IEntityMapper<FitbitAuthData, FitbitAuthDataEntity>>(Identifier.FITBIT_AUTH_DATA_ENTITY_MAPPER)
            .to(FitbitAuthDataEntityMapper).inSingletonScope()
        this.container
            .bind<IEntityMapper<Resource, ResourceEntity>>(Identifier.RESOURCE_ENTITY_MAPPER)
            .to(ResourceEntityMapper).inSingletonScope()
        this.container
            .bind<IEntityMapper<Sleep, SleepEntity>>(Identifier.SLEEP_ENTITY_MAPPER)
            .to(SleepEntityMapper).inSingletonScope()
        this.container
            .bind<IEntityMapper<PhysicalActivity, PhysicalActivityEntity>>(Identifier.PHYSICAL_ACTIVITY_ENTITY_MAPPER)
            .to(PhysicalActivityEntityMapper).inSingletonScope()
        this.container
            .bind<IEntityMapper<Weight, WeightEntity>>(Identifier.WEIGHT_ENTITY_MAPPER)
            .to(WeightEntityMapper).inSingletonScope()

        // Background Services
        this._container
            .bind<IConnectionFactory>(Identifier.MONGODB_CONNECTION_FACTORY)
            .to(ConnectionFactoryMongodb).inSingletonScope()
        this._container
            .bind<IConnectionDB>(Identifier.MONGODB_CONNECTION)
            .to(ConnectionMongodb).inSingletonScope()
        this._container
            .bind<IConnectionFactory>(Identifier.RABBITMQ_CONNECTION_FACTORY)
            .to(ConnectionFactoryRabbitMQ).inSingletonScope()
        this._container
            .bind<IConnectionEventBus>(Identifier.RABBITMQ_CONNECTION)
            .to(ConnectionRabbitMQ)
        this._container
            .bind<IEventBus>(Identifier.RABBITMQ_EVENT_BUS)
            .to(EventBusRabbitMQ).inSingletonScope()
        this._container
            .bind(Identifier.BACKGROUND_SERVICE)
            .to(BackgroundService).inSingletonScope()

        // Tasks
        this._container
            .bind<IBackgroundTask>(Identifier.SUBSCRIBE_EVENT_BUS_TASK)
            .to(SubscribeEventBusTask).inRequestScope()
        this._container
            .bind<IBackgroundTask>(Identifier.COLLECT_FITBIT_USER_DATA_TASK)
            .to(SyncFitbitDataTask).inSingletonScope()

        // Log
        this._container.bind<ILogger>(Identifier.LOGGER).to(CustomLogger).inSingletonScope()
    }
}

export const DIContainer = new IoC().container
