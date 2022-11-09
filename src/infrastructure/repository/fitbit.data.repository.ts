import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { ILogger } from '../../utils/custom.logger'
import { IEntityMapper } from '../port/entity.mapper.interface'
import { FitbitAuthData } from '../../application/domain/model/fitbit.auth.data'
import moment from 'moment'
import jwt from 'jsonwebtoken'
import { PhysicalActivity } from '../../application/domain/model/physical.activity'
import { Sleep } from '../../application/domain/model/sleep'
import { Weight } from '../../application/domain/model/weight'
import { IFitbitDataRepository } from '../../application/port/fitbit.auth.data.repository.interface'
import { FitbitAuthDataEntity } from '../entity/fitbit.auth.data.entity'
import { IFitbitClientRepository } from '../../application/port/fitbit.client.repository.interface'
import { ValidationException } from '../../application/domain/exception/validation.exception'
import { ConflictException } from '../../application/domain/exception/conflict.exception'
import { RepositoryException } from '../../application/domain/exception/repository.exception'
import { ResourceType } from '../../application/domain/utils/resource.type'
import { IResourceRepository } from '../../application/port/resource.repository.interface'
import { Query } from './query/query'
import { Resource } from '../../application/domain/model/resource'
import { DataSync } from '../../application/domain/model/data.sync'
import { UserAuthData } from '../../application/domain/model/user.auth.data'
import { UserAuthDataEntity } from '../entity/user.auth.data.entity'
import { IEventBus } from '../port/event.bus.interface'
import { WeightSyncEvent } from '../../application/integration-event/event/weight.sync.event'
import { SleepSyncEvent } from '../../application/integration-event/event/sleep.sync.event'
import { PhysicalActivitySyncEvent } from '../../application/integration-event/event/physical.activity.sync.event'
import { FitbitLastSyncEvent } from '../../application/integration-event/event/fitbit.last.sync.event'
import { UserIntradayTimeSeries } from '../../application/domain/model/user.intraday.time.series'
import { SleepEntity } from '../entity/sleep.entity'
import { WeightEntity } from '../entity/weight.entity'
import { IntradayTimeSeriesSyncEvent } from '../../application/integration-event/event/intraday.time.series.sync.event'
import { FitbitClientException } from '../../application/domain/exception/fitbit.client.exception'
import { Fitbit } from '../../application/domain/model/fitbit'
import { IFitbitDeviceRepository } from '../../application/port/fitbit.device.repository.interface'

@injectable()
export class FitbitDataRepository implements IFitbitDataRepository {
    constructor(
        @inject(Identifier.USER_AUTH_REPO_MODEL) private readonly _userAuthRepoModel: any,
        @inject(Identifier.USER_AUTH_DATA_ENTITY_MAPPER)
        private readonly _userAuthDataEntityMapper: IEntityMapper<UserAuthData, UserAuthDataEntity>,
        @inject(Identifier.FITBIT_AUTH_DATA_ENTITY_MAPPER)
        private readonly _fitbitAuthEntityMapper: IEntityMapper<FitbitAuthData, FitbitAuthDataEntity>,
        @inject(Identifier.SLEEP_ENTITY_MAPPER) private readonly _sleepMapper: IEntityMapper<Sleep, SleepEntity>,
        @inject(Identifier.WEIGHT_ENTITY_MAPPER) private readonly _weightMapper: IEntityMapper<Weight, WeightEntity>,
        @inject(Identifier.PHYSICAL_ACTIVITY_ENTITY_MAPPER)
        private readonly _activityMapper: IEntityMapper<PhysicalActivity, PhysicalActivity>,
        @inject(Identifier.FITBIT_CLIENT_REPOSITORY) private readonly _fitbitClientRepo: IFitbitClientRepository,
        @inject(Identifier.RESOURCE_REPOSITORY) private readonly _resourceRepo: IResourceRepository,
        @inject(Identifier.FITBIT_DEVICE_REPOSITORY) private readonly _fitbitDeviceRepo: IFitbitDeviceRepository,
        @inject(Identifier.RABBITMQ_EVENT_BUS) private readonly _eventBus: IEventBus,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
    }

    public removeFitbitAuthData(userId: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._userAuthRepoModel
                .updateOne({ user_id: userId }, { $unset: { fitbit: '' } })
                .then(res => resolve(!!res))
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public revokeToken(accessToken: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._fitbitClientRepo.revokeToken(accessToken)
                .then(res => resolve(res))
                .catch(err => reject(err))
        })
    }

    public updateTokenStatus(userId: string, status: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._userAuthRepoModel.findOneAndUpdate(
                { user_id: userId },
                { 'fitbit.status': status },
                { new: true })
                .then(res => resolve(!!res))
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public getTokenIntrospect(token: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getTokenIntrospect(token)
                .then(res => resolve(res))
                .catch(err => reject(err))
        })
    }

    public refreshToken(userId: string, accessToken: string,
        refreshToken: string, expiresIn?: number): Promise<FitbitAuthData | undefined> {
        return new Promise<FitbitAuthData | undefined>(async (resolve, reject) => {
            this._fitbitClientRepo.refreshToken(accessToken, refreshToken, expiresIn)
                .then(async tokenData => {
                    if (!tokenData) return resolve(undefined)
                    const authData: FitbitAuthData = await this.manageAuthData(tokenData)
                    const newTokenData: UserAuthData | undefined = await this.updateRefreshToken(userId, authData)
                    return resolve(newTokenData?.fitbit)
                }).catch(err => {
                    return reject(err)
                })
        })
    }

    private async manageAuthData(authData: any): Promise<FitbitAuthData> {
        try {
            const result: FitbitAuthData = new FitbitAuthData()
            const payload: any = await this.getTokenPayload(authData.access_token)
            if (payload.sub) result.user_id = payload.sub
            if (payload.scopes) result.scope = payload.scopes
            if (payload.exp) result.expires_in = payload.exp
            result.access_token = authData.access_token
            result.refresh_token = authData.refresh_token
            result.token_type = 'Bearer'
            result.status = 'valid_token'
            return Promise.resolve(result)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    public async syncFitbitData(data: FitbitAuthData, userId: string): Promise<DataSync> {
        try {
            if (!data || !data.scope) {
                throw new RepositoryException('Invalid scope, cannot be empty.')
            }
            const scopes: Array<string> = data.scope!.split(' ')

            // Sync Fitbit devices
            this._fitbitDeviceRepo.syncAndParse(scopes, data.access_token!, userId).then().catch()

            // Sync all Fitbit data
            const promises: Array<Promise<any>> = [
                this.syncAndParseWeight(scopes, data.access_token!, userId),
                this.syncAndParseSleep(scopes, data.access_token!, userId),
                this.syncAndParseActivities(scopes, data.access_token!, userId),
                this.syncAndParseIntradayTimeSeries(scopes, 'steps', data.access_token!, userId),
                this.syncAndParseIntradayTimeSeries(scopes, 'calories', data.access_token!, userId),
                this.syncAndParseIntradayTimeSeries(scopes, 'distance', data.access_token!, userId),
                this.syncAndParseMinutesActiveIntradayTimeSeries(scopes, data.access_token!, userId),
                this.syncAndParseHeartRateIntradayTimeSeries(scopes, data.access_token!, userId)
            ]
            this._logger.debug('1 - Arrived before the resolution of the Promises.')
            const results: Array<any> = await Promise.allSettled(promises)
            this._logger.debug('2 - Arrived after the resolution of the Promises.')

            // Verify if someone has a sync error
            const errorResults: Array<any> = results.filter(item => item.status === 'rejected')

            // If all syncs generates an error, reject the sync process error based on error from first promise
            if (results.length === errorResults.length) {
                return Promise.reject(errorResults[0].reason)
            }

            // Finally, the last sync variable from user needs to be updated
            const lastSync = moment.utc().format()
            this._logger.debug('3 - Arrived before LastSync update.')
            this.updateLastSync(userId, lastSync)
                .then(res => {
                    this._logger.debug('4 - Arrived before LastSync was sent to RabbitMQ.')
                    if (res) this.publishLastSync(userId, lastSync)
                    this._logger.debug('5 - Arrived after sending LastSync to RabbitMQ.')
                })
                .catch(err => this._logger.info(`Error at update the last sync: ${err.message}`))

            return Promise.resolve(this.buildResponseSync(results, userId))
        } catch (err) {
            return Promise.reject(err)
        }

    }

    public updateLastSync(userId: string, lastSync: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._userAuthRepoModel.findOneAndUpdate(
                { user_id: userId },
                { 'fitbit.last_sync': lastSync },
                { new: true })
                .then(res => resolve(!!res))
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public getTokenPayload(token: string): Promise<any> {
        try {
            return Promise.resolve(jwt.decode(token))
        } catch (err) {
            return Promise.reject(new ValidationException('Could not complete get token information. ' +
                'Please try again later.'))
        }
    }

    public publishLastSync(userId: string, lastSync: string): void {
        const fitbit: Fitbit = new Fitbit().fromJSON({
            user_id: userId,
            last_sync: lastSync
        })
        this._eventBus
            .publish(new FitbitLastSyncEvent(new Date(), fitbit), FitbitLastSyncEvent.ROUTING_KEY)
            .then(() => this._logger.info(`Last sync from ${userId} successful published!`))
            .catch(err => this._logger.error(`Error at publish last sync: ${err.message}`))
    }

    private buildResponseSync(items: Array<any>, userId: string): DataSync {
        const weights: Array<Weight> = items[0].status === 'fulfilled' ? items[0].value : []
        const sleep: Array<Sleep> = items[1].status === 'fulfilled' ? items[1].value : []
        const activities: Array<PhysicalActivity> = items[2].status === 'fulfilled' ? items[2].value : []
        const intra_steps: Array<UserIntradayTimeSeries> = items[3].status === 'fulfilled' ? items[3].value : []
        const intra_calories: Array<UserIntradayTimeSeries> = items[4].status === 'fulfilled' ? items[4].value : []
        const intra_distance: Array<UserIntradayTimeSeries> = items[5].status === 'fulfilled' ? items[5].value : []
        const intra_min_active: Array<UserIntradayTimeSeries> = items[6].status === 'fulfilled' ? items[6].value : []
        const intra_heartrate: Array<UserIntradayTimeSeries> = items[7].status === 'fulfilled' ? items[7].value : []

        return new DataSync().fromJSON({
            user_id: userId,
            activities: activities.length,
            sleep: sleep.length,
            weights: weights.length,
            intraday: {
                steps: intra_steps.length,
                calories: intra_calories.length,
                distance: intra_distance.length,
                active_minutes: intra_min_active.length,
                heart_rate: intra_heartrate.filter(item => item.data_set?.length).length
            }
        })
    }

    private async syncAndParseWeight(scopes: Array<string>, token: string, userId: string): Promise<Array<Weight>> {
        try {
            // If the user does not have scopes for weight, returns an empty array
            if (!(scopes.includes('rwei'))) return Promise.resolve([])
            // Sync weight data
            const syncWeights: Array<any> = await this.syncWeightData(token)
            if (!syncWeights || !syncWeights.length) return Promise.resolve([])
            // Filter weight data with previous weight data already sync
            const filterSyncWeights: Array<any> = await this.filterDataAlreadySync(syncWeights, ResourceType.BODY, userId)
            if (!filterSyncWeights || !filterSyncWeights.length) return Promise.resolve([])
            // Parse weight data
            const parseWeight: Array<Weight> = this.parseWeightList(filterSyncWeights, userId)
            // Save and publish sync weight data
            if (parseWeight && parseWeight.length) {
                this._eventBus
                    .publish(new WeightSyncEvent(new Date(), parseWeight), WeightSyncEvent.ROUTING_KEY)
                    .then(() => {
                        this._logger.info(`Weight Measurements from ${userId} successful published!`)
                        this.manageResources(syncWeights, userId, ResourceType.BODY).then().catch()
                    })
                    .catch(err => this._logger.error(`Error publishing weights: ${err.message}`))
            }
            return Promise.resolve(parseWeight)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private async syncAndParseSleep(scopes: Array<string>, token: string, userId: string): Promise<Array<Sleep>> {
        try {
            // If the user does not have scopes for sleep, returns an empty array
            if (!(scopes.includes('rsle'))) return Promise.resolve([])
            // Sync sleep data
            const syncSleep: Array<any> = await this.syncSleepData(token)
            if (!syncSleep || !syncSleep.length) return Promise.resolve([])
            // Filter sleep data with previous sleep data already sync
            const filterSleep: Array<any> = await this.filterDataAlreadySync(syncSleep, ResourceType.SLEEP, userId)
            if (!filterSleep || !filterSleep.length) return Promise.resolve([])
            // Parse sleep data
            const parseSleep: Array<Sleep> = await this.parseSleepList(filterSleep, userId)
            // Save and publish sync sleep data
            if (parseSleep && parseSleep.length) {
                this._eventBus
                    .publish(new SleepSyncEvent(new Date(), parseSleep), SleepSyncEvent.ROUTING_KEY)
                    .then(() => {
                        this._logger.info(`Sleep from ${userId} successful published!`)
                        this.manageResources(syncSleep, userId, ResourceType.SLEEP).then().catch()
                    })
                    .catch(err => this._logger.error(`Error publishing sleep: ${err.message}`))
            }
            return Promise.resolve(parseSleep)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private async syncAndParseActivities(scopes: Array<string>, token: string, userId: string): Promise<Array<PhysicalActivity>> {
        try {
            // If the user does not have scopes for activity, returns an empty array
            if (!(scopes.includes('ract'))) return Promise.resolve([])
            // Sync activity data
            const syncActivities: Array<any> = await this.syncUserActivities(token)
            if (!syncActivities || !syncActivities.length) return Promise.resolve([])
            // Filter activity data with previous activity data already sync
            const filterActivities: Array<any> = await this.filterDataAlreadySync(syncActivities, ResourceType.ACTIVITIES, userId)
            if (!filterActivities || !filterActivities.length) return Promise.resolve([])
            // Parse activity data
            const parseActivity: Array<PhysicalActivity> = await this.parsePhysicalActivityList(filterActivities, userId)
            // Save and publish sync activity data
            if (parseActivity && parseActivity.length) {
                this._eventBus
                    .publish(new PhysicalActivitySyncEvent(new Date(), parseActivity), PhysicalActivitySyncEvent.ROUTING_KEY)
                    .then(() => {
                        this._logger.info(`Physical activities from ${userId} successful published!`)
                        this.manageResources(syncActivities, userId, ResourceType.ACTIVITIES).then().catch()
                    })
                    .catch(err => this._logger.error(`Error publishing physical activities: ${err.message}`))
            }
            return Promise.resolve(parseActivity)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private async syncAndParseIntradayTimeSeries(scopes: Array<string>, resource: string, token: string, userId: string):
        Promise<Array<UserIntradayTimeSeries>> {
        try {
            // If the user does not have scopes for activity, returns an empty array
            if (!(scopes.includes('ract'))) return Promise.resolve([])
            const date: string = moment().format('YYYY-MM-DD')
            // Synchronize intraday resource data from the current moment up to six days ago
            const sync_intraday: any = await this.getMultipleIntradayTimeSeries(token, resource, date, 6, userId)
            // Parse intraday resource data
            const parse_intraday: Array<UserIntradayTimeSeries> =
                sync_intraday.map(item => this.parseIntradayTimeSeriesResources(userId, resource, item))
            // Filter undefined items
            const filter_intraday: Array<UserIntradayTimeSeries> = parse_intraday.filter(item => item !== undefined)
            if (filter_intraday && filter_intraday.length) {
                filter_intraday.forEach(item => {
                    const intraday_date: string = moment(item.start_time).format('YYYY-MM-DD')
                    this._eventBus
                        .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                            userId, item), IntradayTimeSeriesSyncEvent.ROUTING_KEY)
                        .then(() => {
                            const msg: string = `${resource} intraday timeseries from ${intraday_date} of ` +
                                `${userId} successful published!`
                            this._logger.info(msg)
                        })
                        .catch(err => {
                            const msg: string = `Error publishing ${resource} intraday time series from ` +
                                `${intraday_date} of ${userId}: ${err.message}`
                            this._logger.error(msg)
                        })
                })
            }
            return Promise.resolve(filter_intraday)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private async syncAndParseMinutesActiveIntradayTimeSeries(scopes: Array<string>, token: string, userId: string):
        Promise<Array<UserIntradayTimeSeries>> {
        try {
            // If the user does not have scopes for activity, returns an empty array
            if (!(scopes.includes('ract'))) return Promise.resolve([])
            const date: string = moment().format('YYYY-MM-DD')
            // Synchronize intraday resource data from the current moment up to six days ago
            const sync_intraday: any = await this.getMultipleActiveMinIntradayTimeSeries(token, date, 6, userId)
            // Parse intraday resource data
            const parse_intraday: Array<UserIntradayTimeSeries> =
                sync_intraday.map(item => this.parseIntradayTimeSeriesResources(userId, 'active_minutes', item))
            // Filter undefined items
            const filter_intraday: Array<UserIntradayTimeSeries> = parse_intraday.filter(item => item !== undefined)
            if (filter_intraday && filter_intraday.length) {
                filter_intraday.forEach(item => {
                    const intraday_date: string = moment(item.start_time).format('YYYY-MM-DD')
                    this._eventBus
                        .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                            userId, item), IntradayTimeSeriesSyncEvent.ROUTING_KEY)
                        .then(() => {
                            const msg: string = `active_minutes intraday timeseries from ${intraday_date} of ` +
                                `${userId} successful published!`
                            this._logger.info(msg)
                        })
                        .catch(err => {
                            const msg: string = `Error publishing active_minutes intraday time series from ` +
                                `${intraday_date} of ${userId}: ${err.message}`
                            this._logger.error(msg)
                        })
                })
            }
            return Promise.resolve(filter_intraday)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private async syncAndParseHeartRateIntradayTimeSeries(scopes: Array<string>, token: string, userId: string):
        Promise<Array<UserIntradayTimeSeries>> {
        try {
            // If the user does not have scopes for activity, returns an empty array
            if (!(scopes.includes('ract'))) return Promise.resolve([])
            const date: string = moment().format('YYYY-MM-DD')
            // Synchronize intraday resource data from the current moment up to six days ago
            const sync_intraday: any = await this.getMultipleHeartRateIntradayTimeSeries(token, date, 6, userId)
            // Parse intraday resource data
            const parse_intraday: Array<UserIntradayTimeSeries> =
                sync_intraday.map(item => this.parseIntradayTimeSeriesHeartRate(userId, item))
            // Filter undefined items
            const filter_intraday: Array<UserIntradayTimeSeries> = parse_intraday.filter(item => item !== undefined)
            if (filter_intraday && filter_intraday.length) {
                filter_intraday.forEach(item => {
                    if (item.data_set && item.data_set.length) {
                        const intraday_date: string = moment(item.start_time).format('YYYY-MM-DD')
                        this._eventBus
                            .publish(
                                new IntradayTimeSeriesSyncEvent(new Date(), userId, item),
                                IntradayTimeSeriesSyncEvent.ROUTING_KEY
                            )
                            .then(() => {
                                const msg: string = `heartrate intraday timeseries from ${intraday_date} of ` +
                                    `${userId} successful published!`
                                this._logger.info(msg)
                            })
                            .catch(err => {
                                const msg: string = `Error publishing heartrate intraday time series from ` +
                                    `${intraday_date} of ${userId}: ${err.message}`
                                this._logger.error(msg)
                            })
                    }
                })
            }
            return Promise.resolve(filter_intraday)
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private updateRefreshToken(userId: string, token: FitbitAuthData): Promise<UserAuthData | undefined> {
        const itemUp: any = this._fitbitAuthEntityMapper.transform(token)
        return new Promise<UserAuthData | undefined>((resolve, reject) => {
            this._userAuthRepoModel.findOneAndUpdate(
                { user_id: userId },
                { fitbit: itemUp },
                { new: true })
                .then(res => {
                    if (!res) return resolve(undefined)
                    return resolve(this._userAuthDataEntityMapper.transform(res))
                }).catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    private async filterDataAlreadySync(data: Array<any>, type: string, userId: string): Promise<Array<any>> {
        try {
            const resources: Array<any> = []
            if (!data || !data.length) return Promise.resolve(resources)
            for await (const item of data) {
                const query: Query = new Query().fromJSON({
                    filters: {
                        'resource.logId': item.logId,
                        'user_id': userId
                    }
                })
                if (type === ResourceType.BODY) query.addFilter({ 'resource.weight': item.weight })
                const exists: boolean = await this._resourceRepo.checkExists(query)
                if (!exists) resources.push(item)
            }
            return Promise.resolve(resources)
        } catch (err) {
            return await Promise.reject(err)
        }
    }

    private async manageResources(resources: Array<any>, userId: string, type: string): Promise<void> {
        try {
            await this.cleanResourceList(userId, type)
            await this.saveResourceList(resources, userId, type)
            return Promise.resolve()
        } catch (err: any) {
            this._logger.error(`Error at save ${type} logs: ${err.message}`)
            return Promise.resolve()
        }
    }

    private cleanResourceList(userId, type): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._resourceRepo
                .deleteByQuery(new Query().fromJSON({ filters: { user_id: userId, type } }))
                .then(res => resolve(res))
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    private saveResourceList(resources: Array<any>, userId: string, type: string): Promise<Array<Resource>> {
        return new Promise<Array<Resource>>(async (resolve, reject) => {
            const result: Array<Resource> = []
            if (!resources || !resources.length) return result
            try {
                for await (const item of resources) {
                    const resource: Resource | undefined = await this._resourceRepo.create(new Resource().fromJSON({
                        resource: item,
                        type,
                        date_sync: moment().utc().format(),
                        user_id: userId,
                        provider: 'Fitbit'
                    }))
                    if (resource) result.push(resource)
                }
            } catch (err) {
                return reject(this.mongoDBErrorListener(err))
            }
            return resolve(result)
        })
    }

    private async syncWeightData(token: string): Promise<any> {
        const now: string = moment().add(1, 'day').format('YYYY-MM-DD')
        const path: string = `/body/log/weight/date/${now}/1m.json`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result.weight))
                .catch(err => reject(err))
        })
    }

    private async syncUserActivities(token: string): Promise<any> {
        const now: string = moment().add(1, 'day').format('YYYY-MM-DD')
        const path: string = `/activities/list.json?beforeDate=${now}&sort=desc&offset=0&limit=100`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result.activities))
                .catch(err => reject(err))
        })
    }

    private async syncSleepData(token: string): Promise<any> {
        const date: string = moment().add(1, 'day').format('YYYY-MM-DD')
        const path: string = `/sleep/list.json?beforeDate=${date}&sort=desc&offset=0&limit=100`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result.sleep))
                .catch(err => reject(err))
        })
    }

    private async getMultipleIntradayTimeSeries
        (token: string, resource: string, baseDate: string, days: number, userId: string): Promise<Array<any>> {
        try {
            const promises: Array<any> = []
            for (let i = 0; i <= days; i++) {
                const date: string = moment(baseDate).subtract(i, 'day').format('YYYY-MM-DD')
                promises.push(this.getIntradayTimeSeries(token, resource, date))
            }
            const result: Array<any> = await Promise.allSettled(promises)

            const failedPromises: Array<any> = result.filter(item => item.status === 'rejected')
            if (failedPromises.length) {
                failedPromises.forEach(promise => {
                    this._logger.error(`Error at sync ${resource} intraday from ${userId}: ${promise.reason.message}`)
                })
                if (failedPromises.length > days) {
                    throw new FitbitClientException(failedPromises[0].reason.type, failedPromises[0].reason.message)
                }
            }
            return Promise.resolve(result.filter(item => item.status === 'fulfilled').map(item => item.value))
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private async getMultipleActiveMinIntradayTimeSeries(token: string, baseDate: string, days: number, userId: string):
        Promise<Array<any>> {
        try {
            const promises: Array<any> = []
            for (let i = 0; i <= days; i++) {
                const date: string = moment(baseDate).subtract(i, 'day').format('YYYY-MM-DD')
                promises.push(this.getActiveMinIntradayTimeSeries(token, date))
            }
            const result: Array<any> = await Promise.allSettled(promises)

            const failedPromises: Array<any> = result.filter(item => item.status === 'rejected')
            if (failedPromises.length) {
                failedPromises.forEach(promise => {
                    this._logger.error(`Error at sync active_minutes intraday from ${userId}: ${promise.reason.message}`)
                })
                // If all promises failed
                if (failedPromises.length > days) {
                    throw new FitbitClientException(failedPromises[0].reason.type, failedPromises[0].reason.message)
                }
            }
            return Promise.resolve(result.filter(item => item.status === 'fulfilled').map(item => item.value))
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private async getMultipleHeartRateIntradayTimeSeries(token: string, baseDate: string, days: number, userId: string):
        Promise<Array<any>> {
        try {
            const promises: Array<any> = []
            for (let i = 0; i <= days; i++) {
                const date: string = moment(baseDate).subtract(i, 'day').format('YYYY-MM-DD')
                promises.push(this.getHeartRateIntradayTimeSeries(token, date))
            }
            const result: Array<any> = await Promise.allSettled(promises)

            const failedPromises: Array<any> = result.filter(item => item.status === 'rejected')
            if (failedPromises.length) {
                failedPromises.forEach(promise => {
                    this._logger.error(`Error at sync heart_rate intraday from ${userId}: ${promise.reason.message}`)
                })
                // If all promises failed
                if (failedPromises.length > days) {
                    throw new FitbitClientException(failedPromises[0].reason.type, failedPromises[0].reason.message)
                }
            }
            return Promise.resolve(result.filter(item => item.status === 'fulfilled').map(item => item.value))
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private getIntradayTimeSeries(token: string, resource: string, date: string): Promise<any> {
        const path: string = `/activities/${resource}/date/${date}/${date}.json`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result))
                .catch(err => reject(err))
        })
    }

    private async getActiveMinIntradayTimeSeries(token: string, baseDate: string): Promise<any> {
        try {
            const intraMinFairlyActive: any =
                await this.getIntradayTimeSeries(token, 'minutesFairlyActive', baseDate)
            const intraMinVeryActive: any =
                await this.getIntradayTimeSeries(token, 'minutesVeryActive', baseDate)
            return Promise.resolve(this.mergeIntradayTimeSeriesValues(intraMinFairlyActive, intraMinVeryActive))
        } catch (err) {
            return Promise.reject()
        }
    }

    private getHeartRateIntradayTimeSeries(token: string, date: string): Promise<any> {
        const path: string = `/activities/heart/date/${date}/1d/1sec.json`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result))
                .catch(err => reject(err))
        })
    }

    // Parsers
    private parseIntradayTimeSeriesResources(userId: string, resource: string, dataset: any): UserIntradayTimeSeries {
        const intraday_data: any = dataset[`activities-${resource}-intraday`]
        const date: string = dataset[`activities-${resource}`][0].dateTime
        let dataset_intraday: Array<any> = intraday_data.dataset
        if (resource === 'distance') {
            dataset_intraday = dataset_intraday.map(item => {
                item.value = Math.round(Number.parseFloat(item.value) * 1000)
                return item
            })
        }
        return new UserIntradayTimeSeries().fromJSON({
            user_id: userId,
            start_time: dataset_intraday.length ?
                moment(date).format('YYYY-MM-DDT').concat(dataset_intraday[0].time) : undefined,
            end_time: dataset_intraday.length ?
                moment(date).format('YYYY-MM-DDT').concat(dataset_intraday[dataset_intraday.length - 1].time) : undefined,
            interval: `${intraday_data.datasetInterval}${intraday_data.datasetType.substr(0, 3)}`,
            type: resource,
            data_set: dataset_intraday
        })
    }

    private parseIntradayTimeSeriesHeartRate(userId: string, data: any): UserIntradayTimeSeries {
        const heart_rate_zone: Array<any> = data['activities-heart'][0].value.heartRateZones
        const date: string = data['activities-heart'][0].dateTime
        const intraday_data: any = data['activities-heart-intraday']
        const dataset_intraday: Array<any> = intraday_data.dataset

        const fat_burn = heart_rate_zone.filter(value => value.name === 'Fat Burn')[0]
        const cardio = heart_rate_zone.filter(value => value.name === 'Cardio')[0]
        const peak = heart_rate_zone.filter(value => value.name === 'Peak')[0]
        const out_of_range = heart_rate_zone.filter(value => value.name === 'Out of Range')[0]

        return new UserIntradayTimeSeries().fromJSON({
            user_id: userId,
            start_time: dataset_intraday.length ?
                moment(date).format('YYYY-MM-DDT').concat(dataset_intraday[0].time) : undefined,
            end_time: dataset_intraday.length ?
                moment(date).format('YYYY-MM-DDT').concat(dataset_intraday[dataset_intraday.length - 1].time) : undefined,
            type: 'heart_rate',
            interval: `${intraday_data.datasetInterval}${intraday_data.datasetType.substr(0, 3)}`,
            zones: {
                fat_burn: {
                    min: fat_burn.min,
                    max: fat_burn.max,
                    duration: fat_burn.minutes * 60000 || 0,
                    calories: fat_burn.caloriesOut || 0
                },
                cardio: {
                    min: cardio.min,
                    max: cardio.max,
                    duration: cardio.minutes * 60000 || 0,
                    calories: cardio.caloriesOut || 0
                },
                peak: {
                    min: peak.min,
                    max: peak.max,
                    duration: peak.minutes * 60000 || 0,
                    calories: peak.caloriesOut || 0
                },
                out_of_range: {
                    min: out_of_range.min,
                    max: out_of_range.max,
                    duration: out_of_range.minutes * 60000 || 0,
                    calories: out_of_range.caloriesOut || 0
                }
            },
            data_set: dataset_intraday
        })
    }

    private parseWeightList(weights: Array<any>, userId: string): Array<Weight> {
        if (!weights || !weights.length) return []
        return weights.map(item => this._weightMapper.transform({ ...item, user_id: userId }))
    }

    private parsePhysicalActivityList(activities: Array<any>, userId: string): Array<PhysicalActivity> {
        if (!activities || !activities.length) return []
        return activities.map(item => this._activityMapper.transform({ ...item, user_id: userId }))
    }

    private parseSleepList(sleep: Array<any>, userId: string): Array<Sleep> {
        if (!sleep || !sleep.length) return []
        return sleep.map(item => this._sleepMapper.transform({ ...item, user_id: userId }))
    }

    private mergeIntradayTimeSeriesValues(intradayOne: any, intradayTwo: any): any {
        const dataset_one: Array<any> = intradayOne['activities-minutesFairlyActive-intraday'].dataset
        const dataset_two: Array<any> = intradayTwo['activities-minutesVeryActive-intraday'].dataset

        const result: any = {
            'activities-active_minutes': [{
                dateTime: intradayOne['activities-minutesFairlyActive'][0].dateTime,
                value: parseInt(intradayOne['activities-minutesFairlyActive'][0].value, 10) +
                    parseInt(intradayTwo['activities-minutesVeryActive'][0].value, 10)
            }],
            'activities-active_minutes-intraday': {
                dataset: [],
                datasetInterval: intradayOne['activities-minutesFairlyActive-intraday'].datasetInterval,
                datasetType: intradayOne['activities-minutesFairlyActive-intraday'].datasetType
            }
        }

        for (let i = 0; i < dataset_one.length; i++) {
            if (dataset_one[i].time === dataset_two[i].time) {
                result['activities-active_minutes-intraday'].dataset.push({
                    time: dataset_one[i].time,
                    value: parseInt(dataset_one[i].value, 10) + parseInt(dataset_two[i].value, 10)
                })
            }
        }
        return result
    }

    // MongoDb Error Listener
    private mongoDBErrorListener(err: any): ValidationException | ConflictException | RepositoryException | undefined {
        if (err && err.name) {
            if (err.name === 'ValidationError') {
                return new ValidationException('Required fields were not provided!', err.message)
            } else if (err.name === 'CastError' || new RegExp(/(invalid format)/i).test(err)) {
                return new ValidationException('The given ID is in invalid format.',
                    'A 12 bytes hexadecimal ID similar to this')
            } else if (err.name === 'MongoError' && err.code === 11000) {
                return new ConflictException('A registration with the same unique data already exists!')
            } else if (err.name === 'ObjectParameterError') {
                return new ValidationException('Invalid query parameters!')
            }
        }
        return new RepositoryException('An internal error has occurred in the database!', 'Please try again later...')
    }
}
