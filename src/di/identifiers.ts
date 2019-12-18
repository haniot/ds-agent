/**
 * Constants used in dependence injection.
 *
 * @abstract
 */
export abstract class Identifier {
    public static readonly APP: any = Symbol.for('App')

    // Controllers
    public static readonly HOME_CONTROLLER: any = Symbol.for('HomeController')
    public static readonly FITBIT_SUBSCRIBER_CONTROLLER: any = Symbol.for('FitbitSubscriberController')
    public static readonly FITBIT_CONTROLLER: any = Symbol.for('FitbitController')
    public static readonly USER_FITBIT_AUTH_CONTROLLER: any = Symbol.for('UserFitbitAuthController')
    public static readonly USER_FITBIT_SYNC_CONTROLLER: any = Symbol.for('UserFitbitSyncController')

    // Services
    public static readonly USER_AUTH_DATA_SERVICE: any = Symbol.for('UserAuthDataService')

    // Repositories
    public static readonly USER_AUTH_DATA_REPOSITORY: any = Symbol.for('UserAuthDataRepository')
    public static readonly FITBIT_DATA_REPOSITORY: any = Symbol.for('FitbitDataRepository')
    public static readonly FITBIT_CLIENT_REPOSITORY: any = Symbol.for('FitbitClientRepository')
    public static readonly RESOURCE_REPOSITORY: any = Symbol.for('ResourceRepository')

    // Models
    public static readonly USER_AUTH_REPO_MODEL: any = Symbol.for('UserAuthRepoModel')
    public static readonly RESOURCE_REPO_MODEL: any = Symbol.for('ResourceRepoModel')

    // Mappers
    public static readonly USER_AUTH_DATA_ENTITY_MAPPER: any = Symbol.for('UserAuthDataEntityMapper')
    public static readonly FITBIT_AUTH_DATA_ENTITY_MAPPER: any = Symbol.for('FitbitAuthDataEntityMapper')
    public static readonly RESOURCE_ENTITY_MAPPER: any = Symbol.for('ResourceEntityMapper')

    // Background Services
    public static readonly MONGODB_CONNECTION_FACTORY: any = Symbol.for('ConnectionFactoryMongodb')
    public static readonly MONGODB_CONNECTION: any = Symbol.for('ConnectionMongodb')
    public static readonly RABBITMQ_CONNECTION_FACTORY: any = Symbol.for('ConnectionFactoryRabbitMQ')
    public static readonly RABBITMQ_CONNECTION: any = Symbol.for('ConnectionRabbitMQ')
    public static readonly RABBITMQ_EVENT_BUS: any = Symbol.for('EventBusRabbitMQ')
    public static readonly BACKGROUND_SERVICE: any = Symbol.for('BackgroundService')

    // Tasks
    public static readonly SUBSCRIBE_EVENT_BUS_TASK: any = Symbol.for('SubscribeEventBusTask')
    public static readonly COLLECT_FITBIT_USER_DATA_TASK: any = Symbol.for('CollectFitbitUserDataTask')

    // Log
    public static readonly LOGGER: any = Symbol.for('CustomLogger')
}
