import { inject, injectable } from 'inversify'
import { Identifier } from '../../di/identifiers'
import { ILogger } from '../../utils/custom.logger'
import { IEntityMapper } from '../port/entity.mapper.interface'
import { FitbitAuthData } from '../../application/domain/model/fitbit.auth.data'
import { OAuthException } from '../../application/domain/exception/oauth.exception'
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
import { ResourceDataType } from '../../application/domain/utils/resource.data.type'
import { IResourceRepository } from '../../application/port/resource.repository.interface'
import { Query } from './query/query'
import { Resource } from '../../application/domain/model/resource'
import { DataSync } from '../../application/domain/model/data.sync'
import { UserAuthData } from '../../application/domain/model/user.auth.data'
import { UserAuthDataEntity } from '../entity/user.auth.data.entity'
import { FitbitClientException } from '../../application/domain/exception/fitbit.client.exception'
import { IEventBus } from '../port/event.bus.interface'
import { WeightSyncEvent } from '../../application/integration-event/event/weight.sync.event'
import { SleepSyncEvent } from '../../application/integration-event/event/sleep.sync.event'
import { PhysicalActivitySyncEvent } from '../../application/integration-event/event/physical.activity.sync.event'
import { FitbitLastSyncEvent } from '../../application/integration-event/event/fitbit.last.sync.event'
import { UserTimeSeries } from '../../application/domain/model/user.time.series'
import { UserIntradayTimeSeries } from '../../application/domain/model/user.intraday.time.series'
import { SleepEntity } from '../entity/sleep.entity'
import { WeightEntity } from '../entity/weight.entity'
import { TimeSeriesSyncEvent } from '../../application/integration-event/event/time.series.sync.event'
import { IntradayTimeSeriesSyncEvent } from '../../application/integration-event/event/intraday.time.series.sync.event'
import { TimeSeriesSync } from '../../application/domain/model/time.series.sync'

@injectable()
export class FitbitDataRepository implements IFitbitDataRepository {
    constructor(
        @inject(Identifier.USER_AUTH_REPO_MODEL) private readonly _userAuthRepoModel: any,
        @inject(Identifier.USER_AUTH_DATA_ENTITY_MAPPER)
        private readonly _userAuthDataEntityMapper: IEntityMapper<UserAuthData, UserAuthDataEntity>,
        @inject(Identifier.FITBIT_AUTH_DATA_ENTITY_MAPPER)
        private readonly _fitbitAuthEntityMapper: IEntityMapper<FitbitAuthData, FitbitAuthDataEntity>,
        @inject(Identifier.SLEEP_ENTITY_MAPPER) readonly _sleepMapper: IEntityMapper<Sleep, SleepEntity>,
        @inject(Identifier.WEIGHT_ENTITY_MAPPER) readonly _weightMapper: IEntityMapper<Weight, WeightEntity>,
        @inject(Identifier.PHYSICAL_ACTIVITY_ENTITY_MAPPER)
        readonly _activityMapper: IEntityMapper<PhysicalActivity, PhysicalActivity>,
        @inject(Identifier.FITBIT_CLIENT_REPOSITORY) private readonly _fitbitClientRepo: IFitbitClientRepository,
        @inject(Identifier.RESOURCE_REPOSITORY) readonly _resourceRepo: IResourceRepository,
        @inject(Identifier.RABBITMQ_EVENT_BUS) readonly _eventBus: IEventBus,
        @inject(Identifier.LOGGER) private readonly _logger: ILogger
    ) {
    }

    public removeFitbitAuthData(userId: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._userAuthRepoModel
                .updateOne({ user_id: userId }, { $unset: { fitbitu: '' } })
                .then(res => resolve(!!res))
                .catch(err => reject(this.mongoDBErrorListener(err)))
        })
    }

    public revokeToken(accessToken: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._fitbitClientRepo.revokeToken(accessToken)
                .then(res => resolve(res))
                .catch(err => reject(this.fitbitClientErrorListener(err, accessToken)))
        })
    }

    public refreshToken(userId: string, accessToken: string, refreshToken: string, expiresIn?: number): Promise<FitbitAuthData> {
        return new Promise<FitbitAuthData>(async (resolve, reject) => {
            this._fitbitClientRepo.refreshToken(accessToken, refreshToken, expiresIn)
                .then(async tokenData => {
                    if (!tokenData) return resolve(undefined)
                    const authData: FitbitAuthData = await this.manageAuthData(tokenData)
                    const newTokenData: UserAuthData = await this.updateRefreshToken(userId, authData)
                    return resolve(newTokenData.fitbit)
                }).catch(err => {
                if (err.type) return reject((this.fitbitClientErrorListener(err, accessToken, refreshToken)))
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

    public async subscribeUserEvent(data: FitbitAuthData, resource: string, subscriptionId: string): Promise<void> {
        try {
            await this._fitbitClientRepo.subscribeUserEvent(data, resource, subscriptionId)
            this._logger.info(`Successful subscribe on ${resource} resource from user ${data.user_id}.`)
            return Promise.resolve()
        } catch (err) {
            return Promise.reject(this.fitbitClientErrorListener(err, data.access_token!, data.refresh_token!))
        }
    }

    public async unsubscribeUserEvent(data: FitbitAuthData, resource: string, subscriptionId: string): Promise<void> {
        try {
            await this._fitbitClientRepo.unsubscribeUserEvent(data, resource, subscriptionId)
            this._logger.info(`Successful unsubscribe on ${resource} resource from user ${data.user_id}.`)
            return Promise.resolve()
        } catch (err) {
            return Promise.reject(this.fitbitClientErrorListener(err, data.access_token!, data.refresh_token!))
        }
    }

    public async syncFitbitData(data: FitbitAuthData, userId: string): Promise<DataSync> {
        return new Promise<DataSync>(async (resolve, reject) => {
                try {
                    if (!data || !data.scope) {
                        throw new RepositoryException('Invalid scope, cannot be empty.')
                    }
                    const scopes: Array<string> = data.scope!.split(' ')
                    const promises: Array<Promise<any>> = []
                    let syncWeights: Array<any> = []
                    let syncSleep: Array<any> = []
                    let syncActivities: Array<any> = []

                    let stepsTimeSeries: any
                    let distanceTimeSeries: any
                    let caloriesTimeSeries: any
                    let minutesFairlyActiveTimeSeries: any
                    let minutesVeryActiveTimeSeries: any
                    let heartRateTimeSeries: any
                    let stepsIntradayTimeSeries: any
                    let distanceIntradayTimeSeries: any
                    let caloriesIntradayTimeSeries: any
                    let minutesFairlyActiveIntradayTimeSeries: any
                    let minutesVeryActiveIntradayTimeSeries: any
                    let heartRateIntradayTimeSeries: any

                    if (scopes.includes('rwei')) syncWeights = await this.syncWeightData(data)
                    if (scopes.includes('rsle')) syncSleep = await this.syncSleepData(data)
                    if (scopes.includes('ract')) {
                        const before_date: string = moment().format('YYYY-MM-DD')
                        const after_date: string = data.last_sync ? data.last_sync :
                            moment(before_date).subtract(1, 'year').format('YYYY-MM-DD')
                        // Get Activities
                        promises.push(this.syncUserActivities(data))

                        // Get Time Series
                        promises.push(this.getTimeSeries(data.access_token!, 'steps', before_date, after_date))
                        promises.push(this.getTimeSeries(data.access_token!, 'distance', before_date, after_date))
                        promises.push(this.getTimeSeries(data.access_token!, 'calories', before_date, after_date))
                        promises.push(this.getTimeSeries(data.access_token!, 'minutesFairlyActive', before_date, after_date))
                        promises.push(this.getTimeSeries(data.access_token!, 'minutesVeryActive', before_date, after_date))
                        promises.push(this.getHeartRateTimeSeries(data.access_token!, before_date, after_date))

                        // Get Intraday Time Series
                        promises.push(this.getTimeSeries(data.access_token!, 'steps', before_date, before_date))
                        promises.push(this.getTimeSeries(data.access_token!, 'distance', before_date, before_date))
                        promises.push(this.getTimeSeries(data.access_token!, 'calories', before_date, before_date))
                        promises.push(this.getTimeSeries(data.access_token!, 'minutesFairlyActive', before_date, before_date))
                        promises.push(this.getTimeSeries(data.access_token!, 'minutesVeryActive', before_date, before_date))
                        heartRateIntradayTimeSeries =
                            await this.getHeartRateIntradayTimeSeries(data.access_token!, before_date, '1sec')
                        const result = await Promise.all(promises)
                        syncActivities = result[0] || []
                        stepsTimeSeries = result[1] || undefined
                        distanceTimeSeries = result[2] || undefined
                        caloriesTimeSeries = result[3] || undefined
                        minutesFairlyActiveTimeSeries = result[4] || undefined
                        minutesVeryActiveTimeSeries = result[5] || undefined
                        heartRateTimeSeries = result[6] || undefined
                        stepsIntradayTimeSeries = result[7] || undefined
                        distanceIntradayTimeSeries = result[8] || undefined
                        caloriesIntradayTimeSeries = result[9] || undefined
                        minutesFairlyActiveIntradayTimeSeries = result[10] || undefined
                        minutesVeryActiveIntradayTimeSeries = result[11] || undefined
                    }

                    const minutesActiveTimeSerie: any =
                        this.mergeTimeSeriesValues(
                            minutesFairlyActiveTimeSeries['activities-minutesFairlyActive'] ?
                                minutesFairlyActiveTimeSeries['activities-minutesFairlyActive'] : [],
                            minutesVeryActiveTimeSeries['activities-minutesVeryActive'] ?
                                minutesVeryActiveTimeSeries['activities-minutesVeryActive'] : [])

                    const minutesActiveIntradayTimeSeries: any =
                        this.mergeIntradayTimeSeriesValues(
                            minutesFairlyActiveIntradayTimeSeries,
                            minutesVeryActiveIntradayTimeSeries)

                    // Filter list of data for does not sync data that was saved
                    const weights: Array<any> = await this.filterDataAlreadySync(syncWeights, ResourceDataType.BODY, userId)
                    const sleep: Array<any> = await this.filterDataAlreadySync(syncSleep, ResourceDataType.SLEEP, userId)
                    const activities: Array<any> = await this.filterDataAlreadySync(syncActivities,
                        ResourceDataType.ACTIVITIES, userId)

                    // Parse Sync Data
                    const weightList: Array<Weight> = await this.parseWeightList(weights, userId)
                    const activitiesList: Array<PhysicalActivity> = await this.parsePhysicalActivityList(activities, userId)
                    const sleepList: Array<Sleep> = await this.parseSleepList(sleep, userId)

                    // Parse Sync Time Series
                    const stepsSeries: UserTimeSeries =
                        this.parseTimeSeriesResources(userId, 'steps', stepsTimeSeries['activities-steps'])
                    const distanceSeries: UserTimeSeries =
                        this.parseTimeSeriesResources(userId, 'distance', distanceTimeSeries['activities-distance'])
                    const caloriesSeries: UserTimeSeries =
                        this.parseTimeSeriesResources(userId, 'calories', caloriesTimeSeries['activities-calories'])
                    const minutesActiveSeries: UserTimeSeries =
                        this.parseTimeSeriesResources(userId,
                            'active_minutes',
                            minutesActiveTimeSerie && minutesActiveTimeSerie['activities-minutes-active'] ?
                                minutesActiveTimeSerie['activities-minutes-active'] : [])
                    const heartRateSeries: UserTimeSeries =
                        this.parseTimeSeriesHeartRate(userId,
                            heartRateTimeSeries && heartRateTimeSeries['activities-heart'] ?
                                heartRateTimeSeries['activities-heart'] : [])

                    // Parse Sync Intraday Time Series
                    const stepsIntradaySeries: UserIntradayTimeSeries = this.parseIntradayTimeSeriesResources(userId,
                        'steps', stepsIntradayTimeSeries)
                    const distanceIntradaySeries: UserIntradayTimeSeries = this.parseIntradayTimeSeriesResources(userId,
                        'distance', distanceIntradayTimeSeries)
                    const caloriesIntradaySeries: UserIntradayTimeSeries =
                        this.parseIntradayTimeSeriesResources(userId, 'calories', caloriesIntradayTimeSeries)
                    const minutesActiveIntradaySeries: UserIntradayTimeSeries =
                        this.parseIntradayTimeSeriesResources(userId, 'active_minutes', minutesActiveIntradayTimeSeries)
                    const heartRateIntradaySeries: UserIntradayTimeSeries =
                        this.parseIntradayTimeSeriesHeartRate(userId, heartRateIntradayTimeSeries)

                    // The sync data must be published to the message bus.
                    if (activitiesList.length) {
                        this._eventBus
                            .publish(new PhysicalActivitySyncEvent(new Date(), activitiesList), 'physicalactivities.sync')
                            .then(() => {
                                this._logger.info(`Physical activities from ${userId} successful published!`)
                                this.saveResourceList(activities, userId)
                                    .then(() => this._logger.info(`Physical Activity logs from ${userId} saved successful!`))
                                    .catch(err => this._logger.error(`Error at save physical activities logs: ${err.message}`))
                            })
                            .catch(err => this._logger.error(`Error publishing physical activities: ${err.message}`))
                    }
                    if (weightList.length) {
                        this._eventBus
                            .publish(new WeightSyncEvent(new Date(), weightList), 'weights.sync')
                            .then(() => {
                                this._logger.info(`Weight Measurements from ${userId} successful published!`)
                                this.saveResourceList(weights, userId)
                                    .then(() => this._logger.info(`Weight logs from ${userId} saved successful!`))
                                    .catch(err => this._logger.error(`Error at save weight logs: ${err.message}`))
                            })
                            .catch(err => this._logger.error(`Error publishing weights: ${err.message}`))
                    }
                    if (sleepList.length) {
                        this._eventBus
                            .publish(new SleepSyncEvent(new Date(), sleepList), 'sleep.sync')
                            .then(() => {
                                this._logger.info(`Sleep from ${userId} successful published!`)
                                this.saveResourceList(sleep, userId)
                                    .then(() => this._logger.info(`Sleep logs from ${userId} saved successful!`))
                                    .catch(err => this._logger.error(`Error at save sleep logs: ${err.message}`))
                            })
                            .catch(err => this._logger.error(`Error publishing sleep: ${err.message}`))
                    }
                    if (stepsSeries !== undefined) {
                        this._eventBus
                            .publish(new TimeSeriesSyncEvent(new Date(), userId, stepsSeries), 'timeseries.sync')
                            .then(() => this._logger.info(`Step time series from ${userId} successful published!`))
                            .catch(err => this._logger.error(`Error publishing step time series: ${err.message}`))
                    }
                    if (caloriesSeries !== undefined) {
                        this._eventBus
                            .publish(new TimeSeriesSyncEvent(new Date(), userId, caloriesSeries), 'timeseries.sync')
                            .then(() => this._logger.info(`Calories time series from ${userId} successful published!`))
                            .catch(err => this._logger.error(`Error publishing calories time series: ${err.message}`))
                    }
                    if (distanceSeries !== undefined) {
                        this._eventBus
                            .publish(new TimeSeriesSyncEvent(new Date(), userId, distanceSeries), 'timeseries.sync')
                            .then(() => this._logger.info(`Distance time series from ${userId} successful published!`))
                            .catch(err => this._logger.error(`Error publishing distance time series: ${err.message}`))
                    }
                    if (minutesActiveSeries !== undefined) {
                        this._eventBus
                            .publish(new TimeSeriesSyncEvent(new Date(), userId, minutesActiveSeries), 'timeseries.sync')
                            .then(() => this._logger.info(`Minutes active time series from ${userId} successful published!`))
                            .catch(err => this._logger.error(`Error publishing minutes active time series: ${err.message}`))
                    }
                    if (heartRateSeries !== undefined) {
                        this._eventBus
                            .publish(new TimeSeriesSyncEvent(new Date(), userId, heartRateSeries), 'timeseries.sync')
                            .then(() => this._logger.info(`Heartrate time series from ${userId} successful published!`))
                            .catch(err => this._logger.error(`Error publish heartrate time series: ${err.message}`))
                    }
                    if (stepsIntradaySeries !== undefined) {
                        this._eventBus
                            .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                                userId, stepsIntradaySeries), 'intraday.sync')
                            .then(() => this._logger.info(`Steps intraday time series from ${userId} successful published!`))
                            .catch(err => this._logger.error(`Error publishing steps intraday time series: ${err.message}`))
                    }
                    if (distanceIntradaySeries !== undefined) {
                        this._eventBus
                            .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                                userId, distanceIntradaySeries), 'intraday.sync')
                            .then(() => this._logger.info(`Distance intraday time series from ${userId} successful published!`))
                            .catch(err => this._logger.error(`Error publishing distance intraday time series: ${err.message}`))
                    }
                    if (caloriesIntradaySeries !== undefined) {
                        this._eventBus
                            .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                                userId, caloriesIntradaySeries), 'intraday.sync')
                            .then(() => this._logger.info(`Calories intraday time series from ${userId} successful published!`))
                            .catch(err => this._logger.error(`Error publishing steps intraday time series: ${err.message}`))
                    }
                    if (minutesActiveIntradaySeries !== undefined) {
                        this._eventBus
                            .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                                userId, minutesActiveIntradaySeries), 'intraday.sync')
                            .then(() => this._logger
                                .info(`Minutes Active intraday time series from ${userId} successful published!`))
                            .catch(err => this._logger
                                .error(`Error publishing minutes active intraday time series: ${err.message}`))
                    }
                    if (heartRateIntradaySeries !== undefined) {
                        this._eventBus
                            .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                                userId, heartRateIntradaySeries), 'intraday.sync')
                            .then(() => this._logger
                                .info(`Heartrate intraday time series from ${userId} successful published!`))
                            .catch(err => this._logger
                                .error(`Error publishing minutes active intraday time series: ${err.message}`))
                    }

                    // Finally, the last sync variable from user needs to be updated
                    const lastSync = moment.utc().format()
                    this.updateLastSync(userId, lastSync)
                        .then(res => {
                            if (res) this.publishLastSync(userId, lastSync)
                        })
                        .catch(err => this._logger.info(`Error at update the last sync: ${err.message}`))

                    // Build Object to return
                    const dataSync: DataSync = new DataSync()
                    dataSync.user_id = userId
                    dataSync.activities = activitiesList.length || 0
                    dataSync.weights = weightList.length || 0
                    dataSync.sleep = sleepList.length || 0
                    dataSync.timeseries = new TimeSeriesSync().fromJSON({
                        steps: stepsSeries && stepsSeries.data_set ? stepsSeries.data_set.length : 0,
                        calories: caloriesSeries && caloriesSeries.data_set ? caloriesSeries.data_set.length : 0,
                        distance: distanceSeries && distanceSeries.data_set ? distanceSeries.data_set.length : 0,
                        heart_rate: heartRateSeries && heartRateSeries.data_set ? heartRateSeries.data_set.length : 0,
                        active_minutes: minutesActiveSeries && minutesActiveSeries.data_set ?
                            minutesActiveSeries.data_set.length : 0
                    })
                    dataSync.intraday = new TimeSeriesSync().fromJSON({
                        steps: stepsIntradaySeries.data_set!.length || 0,
                        calories: caloriesIntradaySeries.data_set!.length || 0,
                        distance: distanceIntradaySeries.data_set!.length || 0,
                        heart_rate: heartRateIntradaySeries.data_set!.length || 0,
                        active_minutes: minutesActiveIntradaySeries.data_set!.length || 0
                    })
                    return resolve(dataSync)
                } catch
                    (err) {
                    return reject(err)
                }
            }
        )
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

    public async syncLastFitbitData(data: FitbitAuthData, userId: string, type: string, date: string): Promise<void> {
        try {
            const scopes: Array<string> = data.scope!.split(' ')
            if (scopes.includes('ract')) {
                await this.syncLastFitbitIntradayTimeSeries(data, userId, date)
            }
            if (type === ResourceDataType.BODY) await this.syncLastFitbitUserWeight(data, userId, date)
            else if (type === ResourceDataType.ACTIVITIES) {
                await this.syncLastFitbitUserActivity(data, userId, date)
            } else if (type === ResourceDataType.SLEEP) await this.syncLastFitbitUserSleep(data, userId, date)
            const lastSync: string = moment.utc().format()
            this.updateLastSync(userId, lastSync)
                .then(res => {
                    if (res) this.publishLastSync(userId, lastSync)
                }).catch(err => this._logger.info(`Error at update the last sync: ${err.message}`))
            return Promise.resolve()
        } catch (err) {
            return Promise.reject(err)
        }
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
        this._eventBus
            .publish(new FitbitLastSyncEvent(new Date(), {
                patient_id: userId,
                last_sync: lastSync
            }), 'fitbit.lastsync')
            .then(() => this._logger.info(`Last sync from ${userId} successful published!`))
            .catch(err => this._logger.error(`Error at publish last sync: ${err.message}`))
    }

    private updateRefreshToken(userId: string, token: FitbitAuthData): Promise<UserAuthData> {
        const itemUp: any = this._fitbitAuthEntityMapper.transform(token)
        return new Promise<UserAuthData>((resolve, reject) => {
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
            if (!data || !data.length) return resources
            for await(const item of data) {
                const query: Query = new Query().fromJSON({
                    filters: {
                        'resource.logId': item.logId,
                        'user_id': userId
                    }
                })
                if (type === ResourceDataType.BODY) query.addFilter({ 'resource.weight': item.weight })
                const exists: boolean = await this._resourceRepo.checkExists(query)
                if (!exists) resources.push(item)
            }
            return resources
        } catch (err) {
            return await Promise.reject(err)
        }
    }

    private syncLastFitbitUserWeight(data: FitbitAuthData, userId: string, date: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getUserBodyDataFromInterval(data.access_token!, date, date)
                .then(async weights => {
                    if (weights && weights.length) {
                        const resources: Array<any> = await this.filterDataAlreadySync(weights, ResourceDataType.BODY, userId)

                        // Parse list of weights
                        const weightList: Array<Weight> = this.parseWeightList(resources, userId)
                        if (weightList.length) {
                            // Publish list of weights
                            this._eventBus
                                .publish(new WeightSyncEvent(new Date(), weightList), 'weights.sync')
                                .then(() => {
                                    this._logger.info(`Weight Measurements from ${userId} successful published!`)
                                    this.saveResourceList(weights, userId)
                                        .then(() => this._logger.info(`Weight resource from ${userId} saved successful!`))
                                        .catch(err => this._logger.error(`Error at save weight resource: ${err.message}`))
                                })
                                .catch(err => this._logger.error(`Error publishing weight: ${err.message}`))
                        }
                    }
                    return resolve()
                }).catch(err => reject(err))
        })
    }

    private syncLastFitbitUserActivity(data: FitbitAuthData, userId: string, date: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getUserActivities(data.access_token!, 100, date)
                .then(async activities => {
                    if (activities && activities.length) {
                        const resources: Array<any> =
                            await this.filterDataAlreadySync(activities, ResourceDataType.ACTIVITIES, userId)

                        // Parse list of activities
                        const activityList: Array<PhysicalActivity> = this.parsePhysicalActivityList(resources, userId)
                        if (activityList.length) {
                            this._eventBus
                                .publish(new PhysicalActivitySyncEvent(new Date(), activityList), 'physicalactivities.sync')
                                .then(() => {
                                    this._logger.info(`Physical activities from ${userId} successful published!`)
                                    this.saveResourceList(activities, userId)
                                        .then(() => {
                                            this._logger.info(`Physical Activity resource from ${userId} saved successful!`)
                                        })
                                        .catch(err => {
                                            this._logger.error(`Error at save physical activity resource: ${err.message}`)
                                        })
                                })
                                .catch(err => this._logger.error(`Error publishing physical activities: ${err.message}`))
                        }
                    }
                    return resolve()
                }).catch(err => reject(err))
        })
    }

    private async syncLastFitbitIntradayTimeSeries(data: FitbitAuthData, userId: string, date: string): Promise<void> {
        try {
            const promises: Array<any> = []
            promises.push(this.getTimeSeries(data.access_token!, 'steps', date, date))
            promises.push(this.getTimeSeries(data.access_token!, 'distance', date, date))
            promises.push(this.getTimeSeries(data.access_token!, 'calories', date, date))
            promises.push(this.getTimeSeries(data.access_token!, 'minutesFairlyActive', date, date))
            promises.push(this.getTimeSeries(data.access_token!, 'minutesVeryActive', date, date))
            promises.push(this.getHeartRateIntradayTimeSeries(data.access_token!, date, '1sec'))
            const result = await Promise.all(promises)

            const stepsIntradaySeries: UserIntradayTimeSeries = this.parseIntradayTimeSeriesResources(userId,
                'steps', result[0])
            const distanceIntradaySeries: UserIntradayTimeSeries = this.parseIntradayTimeSeriesResources(userId,
                'distance', result[1])
            const caloriesIntradaySeries: UserIntradayTimeSeries =
                this.parseIntradayTimeSeriesResources(userId, 'calories', result[2])
            const minutesActiveIntradaySeries: UserIntradayTimeSeries =
                this.parseIntradayTimeSeriesResources(userId,
                    'active_minutes', this.mergeIntradayTimeSeriesValues(result[3], result[4]))
            const heartRateIntradaySeries: UserIntradayTimeSeries =
                this.parseIntradayTimeSeriesHeartRate(userId, result[5])

            if (stepsIntradaySeries !== undefined) {
                this._eventBus
                    .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                        userId, stepsIntradaySeries), 'intraday.sync')
                    .then(() => this._logger.info(`Steps intraday time series from ${userId} successful published!`))
                    .catch(err => this._logger.error(`Error publishing steps intraday time series: ${err.message}`))
            }
            if (distanceIntradaySeries !== undefined) {
                this._eventBus
                    .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                        userId, distanceIntradaySeries), 'intraday.sync')
                    .then(() => this._logger.info(`Distance intraday time series from ${userId} successful published!`))
                    .catch(err => this._logger.error(`Error publishing distance intraday time series: ${err.message}`))
            }
            if (caloriesIntradaySeries !== undefined) {
                this._eventBus
                    .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                        userId, caloriesIntradaySeries), 'intraday.sync')
                    .then(() => this._logger.info(`Calories intraday time series from ${userId} successful published!`))
                    .catch(err => this._logger.error(`Error publishing steps intraday time series: ${err.message}`))
            }
            if (minutesActiveIntradaySeries !== undefined) {
                this._eventBus
                    .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                        userId, minutesActiveIntradaySeries), 'intraday.sync')
                    .then(() => this._logger
                        .info(`Minutes Active intraday time series from ${userId} successful published!`))
                    .catch(err => this._logger
                        .error(`Error publishing minutes active intraday time series: ${err.message}`))
            }
            if (heartRateIntradaySeries !== undefined) {
                this._eventBus
                    .publish(new IntradayTimeSeriesSyncEvent(new Date(),
                        userId, heartRateIntradaySeries), 'intraday.sync')
                    .then(() => this._logger
                        .info(`Heartrate intraday time series from ${userId} successful published!`))
                    .catch(err => this._logger
                        .error(`Error publishing minutes active intraday time series: ${err.message}`))
            }
            return Promise.resolve()
        } catch (err) {
            return Promise.reject(err)
        }
    }

    private syncLastFitbitUserSleep(data: FitbitAuthData, userId: string, date: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getUserSleepFromInterval(data.access_token!, date, date)
                .then(async sleeps => {
                    if (sleeps && sleeps.length) {
                        const resources: Array<any> = await this.filterDataAlreadySync(sleeps, ResourceDataType.SLEEP, userId)

                        // Parse list of sleep
                        const sleepList: Array<Sleep> = this.parseSleepList(resources, userId)
                        if (sleepList.length) {
                            // Publish list of sleep.
                            this._eventBus
                                .publish(new SleepSyncEvent(new Date(), sleepList), 'sleep.sync')
                                .then(() => {
                                    this._logger.info(`Sleep from ${userId} successful published!`)
                                    this.saveResourceList(sleeps, userId)
                                        .then(() => this._logger.info(`Sleep resource from ${userId} saved successful!`))
                                        .catch(err => this._logger.error(`Error at save sleep resource: ${err.message}`))
                                })
                                .catch(err => this._logger.error(`Error publishing sleep: ${err.message}`))
                        }
                    }
                    return resolve()
                }).catch(err => reject(err))
        })
    }

    public saveResourceList(resources: Array<any>, userId: string): Promise<Array<Resource>> {
        return new Promise<Array<Resource>>(async (resolve, reject) => {
            const result: Array<Resource> = []
            if (!resources || !resources.length) return result
            try {
                for await (const item of resources) {
                    const resource: Resource = await this._resourceRepo.create(new Resource().fromJSON({
                        resource: item,
                        date_sync: moment().utc().format(),
                        user_id: userId,
                        provider: 'Fitbit'
                    }))
                    result.push(resource)
                }
            } catch (err) {
                return reject(this.mongoDBErrorListener(err))
            }
            return resolve(result)
        })
    }

    public syncWeightData(data: FitbitAuthData): Promise<Array<any>> {
        return new Promise<Array<any>>(async (resolve, reject) => {
            try {
                if ((data.last_sync && moment().diff(moment(data.last_sync), 'days') <= 31)) {
                    return resolve(await this.getUserBodyDataFromInterval(
                        data.access_token!,
                        moment(data.last_sync).format('YYYY-MM-DD'),
                        moment().format('YYYY-MM-DD')))
                }

                const result: Array<any> = new Array<any>()
                result.push(
                    this.getUserBodyDataFromInterval(
                        data.access_token!,
                        moment().subtract(1, 'month').format('YYYY-MM-DD'),
                        moment().format('YYYY-MM-DD'))
                )
                for (let i = 1; i < 12; i++) {
                    result.push(
                        this.getUserBodyDataFromInterval(
                            data.access_token!,
                            moment().subtract(i + 1, 'month').format('YYYY-MM-DD'),
                            moment().subtract(i, 'month').format('YYYY-MM-DD'))
                    )
                }
                return resolve((await Promise.all(result)).reduce((prev, current) => prev.concat(current), []))
            } catch (err) {
                return reject(err)
            }
        })
    }

    public async syncSleepData(data: FitbitAuthData): Promise<Array<any>> {
        return new Promise<Array<any>>(async (resolve, reject) => {
            try {
                if ((data.last_sync && moment().diff(moment(data.last_sync), 'days') <= 31)) {
                    return resolve(await this.getUserSleepAfter(
                        data.access_token!,
                        100,
                        moment(data.last_sync).format('YYYY-MM-DD'))
                    )
                }
                return resolve(await this.getUserSleepBefore(
                    data.access_token!,
                    100,
                    moment().add(1, 'day').format('YYYY-MM-DD')))
            } catch (err) {
                return reject(err)
            }
        })
    }

    public syncUserActivities(data: FitbitAuthData): Promise<Array<any>> {
        if (data.last_sync) {
            return this.getUserActivities(
                data.access_token!, 100,
                moment(data.last_sync).format('YYYY-MM-DD')
            )
        }
        return this.getLastUserActivities(data.access_token!)
    }

    private async getUserBodyDataFromInterval(token: string, baseDate: string, endDate: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo
                .getDataFromPath(`/body/log/weight/date/${baseDate}/${endDate}.json`, token)
                .then(result => resolve(result.weight))
                .catch(err => reject(this.fitbitClientErrorListener(err, token)))
        })
    }

    private async getLastUserActivities(token: string): Promise<any> {
        const now: string = moment().add(1, 'day').format('YYYY-MM-DD')
        const path: string = `/activities/list.json?beforeDate=${now}&sort=desc&offset=0&limit=100`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result.activities))
                .catch(err => reject(this.fitbitClientErrorListener(err, token)))
        })
    }

    private async getUserActivities(token: string, limit: number, afterDate: string): Promise<any> {
        const path: string = `/activities/list.json?afterDate=${afterDate}&sort=desc&offset=0&limit=${limit}`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result.activities))
                .catch(err => reject(this.fitbitClientErrorListener(err, token)))
        })
    }

    private async getUserSleepAfter(token: string, limit: number, afterDate: string): Promise<any> {
        const path: string = `/sleep/list.json?afterDate=${afterDate}&sort=desc&offset=0&limit=${limit}`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result.sleep))
                .catch(err => reject(this.fitbitClientErrorListener(err, token)))
        })
    }

    private async getUserSleepBefore(token: string, limit: number, beforeDate: string): Promise<any> {
        const path: string = `/sleep/list.json?beforeDate=${beforeDate}&sort=desc&offset=0&limit=${limit}`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result.sleep))
                .catch(err => reject(this.fitbitClientErrorListener(err, token)))
        })
    }

    private async getUserSleepFromInterval(token: string, baseDate: string, endDate: string): Promise<any> {
        const path: string = `/sleep/date/${baseDate}/${endDate}.json`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result.sleep))
                .catch(err => reject(this.fitbitClientErrorListener(err, token)))
        })
    }

    public getTimeSeries(token: string, resource: string, baseDate: string, endDate: string): Promise<any> {
        const path: string = `/activities/${resource}/date/${baseDate}/${endDate}.json`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result))
                .catch(err => reject(this.fitbitClientErrorListener(err, token)))
        })
    }

    public getHeartRateIntradayTimeSeries(token: string, date: string, detailLevel: string): Promise<any> {
        const path: string = `/activities/heart/date/${date}/1d/${detailLevel}.json`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result))
                .catch(err => reject(this.fitbitClientErrorListener(err, token)))
        })
    }

    public getHeartRateTimeSeries(token: string, baseDate: string, endDate: string): Promise<any> {
        const path: string = `/activities/heart/date/${baseDate}/${endDate}.json`
        return new Promise<any>((resolve, reject) => {
            this._fitbitClientRepo.getDataFromPath(path, token)
                .then(result => resolve(result))
                .catch(err => reject(this.fitbitClientErrorListener(err, token)))
        })
    }

    // Parsers
    public parseIntradayTimeSeriesResources(userId: string, resource: string, dataset: any): UserIntradayTimeSeries {
        const intraday_data: any = dataset[`activities-${resource}-intraday`]
        const dataset_intraday: Array<any> = intraday_data.dataset
        return new UserIntradayTimeSeries().fromJSON({
            patient_id: userId,
            start_time: dataset_intraday.length ?
                moment().format('YYYY-MM-DDT').concat(dataset_intraday[0].time) : undefined,
            end_time: dataset_intraday.length ?
                moment().format('YYYY-MM-DDT').concat(dataset_intraday[dataset_intraday.length - 1].time) : undefined,
            interval: `${intraday_data.datasetInterval}${intraday_data.datasetType.substr(0, 3)}`,
            type: resource,
            data_set: dataset_intraday
        })
    }

    public parseIntradayTimeSeriesHeartRate(userId: string, data: any): UserIntradayTimeSeries {
        const heart_rate_zone: Array<any> = data['activities-heart'][0].value.heartRateZones
        const intraday_data: any = data['activities-heart-intraday']
        const dataset_intraday: Array<any> = intraday_data.dataset

        const fat_burn = heart_rate_zone.filter(value => value.name === 'Fat Burn')[0]
        const cardio = heart_rate_zone.filter(value => value.name === 'Cardio')[0]
        const peak = heart_rate_zone.filter(value => value.name === 'Peak')[0]
        const out_of_range = heart_rate_zone.filter(value => value.name === 'Out of Range')[0]

        return new UserIntradayTimeSeries().fromJSON({
            patient_id: userId,
            start_time: dataset_intraday.length ?
                moment().format('YYYY-MM-DDT').concat(dataset_intraday[0].time) : undefined,
            end_time: dataset_intraday.length ?
                moment().format('YYYY-MM-DDT').concat(dataset_intraday[dataset_intraday.length - 1].time) : undefined,
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

    public parseTimeSeriesResources(userId: string, resource: string, dataset: Array<any>): UserTimeSeries {
        if (!dataset || !dataset.length) return undefined!
        return new UserTimeSeries().fromJSON({
            patient_id: userId,
            type: resource,
            data_set: dataset.map(item => {
                return {
                    date: item.dateTime,
                    value: parseFloat(item.value)
                }
            })
        })
    }

    public parseTimeSeriesHeartRate(userId: string, dataset: Array<any>): UserTimeSeries {
        return new UserTimeSeries().fromJSON({
            patient_id: userId,
            type: 'heart_rate',
            data_set: dataset.map(item => {
                const fat_burn = item.value.heartRateZones.filter(value => value.name === 'Fat Burn')[0]
                const cardio = item.value.heartRateZones.filter(value => value.name === 'Cardio')[0]
                const peak = item.value.heartRateZones.filter(value => value.name === 'Peak')[0]
                const out_of_range = item.value.heartRateZones.filter(value => value.name === 'Out of Range')[0]
                return {
                    date: item.dateTime,
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
                    }
                }
            })
        })
    }

    private parseWeightList(weights: Array<any>, userId: string): Array<Weight> {
        if (!weights || !weights.length) return []
        return weights.map(item => this._weightMapper.transform({ ...item, patient_id: userId }))
    }

    private parsePhysicalActivityList(activities: Array<any>, userId: string): Array<PhysicalActivity> {
        if (!activities || !activities.length) return []
        return activities.map(item => this._activityMapper.transform({ ...item, patient_id: userId }))
    }

    private parseSleepList(sleep: Array<any>, userId: string): Array<Sleep> {
        if (!sleep || !sleep.length) return []
        return sleep.map(item => this._sleepMapper.transform({ ...item, patient_id: userId }))
    }

    public mergeTimeSeriesValues(intradayOne: Array<any>, intradayTwo: Array<any>): any {
        const result: any = { 'activities-minutes-active': [] }
        if (!intradayOne || !intradayOne.length || !intradayTwo || !intradayTwo.length) return result
        for (let i = 0; i < intradayOne.length; i++) {
            if (intradayOne[i].dateTime === intradayTwo[i].dateTime) {
                result['activities-minutes-active'].push({
                    dateTime: intradayOne[i].dateTime,
                    value: `${parseInt(intradayOne[i].value, 10) + parseInt(intradayTwo[i].value, 10)}`
                })
            }
        }
        return result
    }

    public mergeIntradayTimeSeriesValues(intradayOne: any, intradayTwo: any): any {
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

    private fitbitClientErrorListener(err: any, accessToken?: string, refreshToken?: string, userId?: string):
        OAuthException | FitbitClientException | undefined {
        if (err.type === 'client_error') {
            return new FitbitClientException(
                'client_error',
                'Could not connect with the Fitbit Server',
                'Please try again later.')
        }
        if (err.type === 'expired_token') {
            return new OAuthException(
                'expired_token',
                'Access token expired.',
                `The access token ${accessToken} has been expired and needs to be refreshed.`)
        } else if (err.type === 'invalid_token') {
            return new OAuthException(
                'invalid_token',
                'Access token invalid.',
                `The access token ${accessToken} is invalid. Please make a new Fitbit Auth Data request and try again.`)
        } else if (err.type === 'invalid_grant') {
            return new OAuthException(
                'invalid_grant',
                'Refresh token invalid.',
                `The refresh token ${refreshToken} is invalid. Please make a new Fitbit Auth Data request and try again.`)
        } else if (err.type === 'system') {
            return new OAuthException(
                'system',
                `Data request limit for access token ${accessToken} has expired.`,
                'Please wait a minimum of one hour and try make the operation again.')
        } else if (err.type === 'invalid_client') {
            return new OAuthException(
                'invalid_client',
                'Invalid Fitbit Client data.',
                'The Fitbit Client credentials are invalid. The operation cannot be performed.')
        } else if (err.type === 'internal_error') {
            return new OAuthException('internal_error', 'A internal error occurs. Please, try again later.')
        }
        return new OAuthException(err.type, err.message)
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
