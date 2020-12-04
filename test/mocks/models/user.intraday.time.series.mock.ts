import { UserIntradayTimeSeries } from '../../../src/application/domain/model/user.intraday.time.series'
import { DefaultFunctions } from '../utils/default.functions'
import { HeartRateZone } from '../../../src/application/domain/model/heart.rate.zone'
import { TimeSeries } from '../../../src/application/domain/model/time.series'
import { TimeSeriesHeartRate } from '../../../src/application/domain/model/time.series.heart.rate'
import { Item } from '../../../src/application/domain/model/item'

export class UserIntradayTimeSeriesMock {

    public generate(type?: string): UserIntradayTimeSeries {
        const userIntradayTimeSeries: UserIntradayTimeSeries = new UserIntradayTimeSeries()

        if (!type) type = this.chooseType()

        const startTime: Date = new Date(1560826800000 + Math.floor((Math.random() * 1000)))
        const endTime: Date = new Date(new Date(startTime)
            .setMilliseconds(Math.floor(Math.random() * 35 + 10) * 60000))  // 10-45min in milliseconds

        userIntradayTimeSeries.user_id = DefaultFunctions.generateObjectId()
        userIntradayTimeSeries.start_time = startTime.toISOString()
        userIntradayTimeSeries.end_time = endTime.toISOString()
        userIntradayTimeSeries.interval = this.chooseInterval()
        userIntradayTimeSeries.type = type
        if (userIntradayTimeSeries.type === 'heart_rate') userIntradayTimeSeries.zones = this.generateZones()
        userIntradayTimeSeries.data_set = this.generateDataSet()
        if (userIntradayTimeSeries.type === 'heart_rate') userIntradayTimeSeries.data_set = this.generateDataSet(true)

        return userIntradayTimeSeries
    }

    private chooseInterval(): string {
        switch (Math.floor((Math.random() * 4))) { // 0-3
            case 0:
                return '1s'
            case 1:
                return '15s'
            case 2:
                return '1m'
            default:
                return '15m'
        }
    }

    private chooseType(): string {
        switch (Math.floor((Math.random() * 5))) { // 0-4
            case 0:
                return 'steps'
            case 1:
                return 'calories'
            case 2:
                return 'distance'
            case 3:
                return 'active_minutes'
            default:
                return 'heart_rate'
        }
    }

    private generateZones(): HeartRateZone {
        const zonesJSON: any = {
            out_of_range: {
                min: 30,
                max: 91,
                duration: 0,
                calories: 0
            },
            fat_burn: {
                min: 91,
                max: 127,
                duration: 10,
                calories: 100
            },
            cardio: {
                min: 127,
                max: 154,
                duration: 0,
                calories: 50
            },
            peak: {
                min: 154,
                max: 220,
                duration: 0,
                calories: 30
            }
        }
        return new HeartRateZone().fromJSON(zonesJSON)
    }

    private generateDataSet(isHeartRate?: boolean): Array<TimeSeries | TimeSeriesHeartRate> {
        if (isHeartRate) {
            const timeSeriesHeartRate1: TimeSeriesHeartRate = new TimeSeriesHeartRate()
            timeSeriesHeartRate1.date = '2020-12-01'
            timeSeriesHeartRate1.zones = this.generateZones()

            const timeSeriesHeartRate2: TimeSeriesHeartRate = new TimeSeriesHeartRate()
            timeSeriesHeartRate2.date = '2020-12-02'
            timeSeriesHeartRate2.zones = this.generateZones()

            return [timeSeriesHeartRate1, timeSeriesHeartRate2]
        }

        // Type other than heart_rate
        let item1: Item = new Item()
        item1.date = '2020-12-01'
        item1.value = 20
        let item2: Item = new Item()
        item2.date = '2020-12-02'
        item2.value = 20

        let dataSet: Array<Item> = [item1, item2]

        const timeSeriesItem1: TimeSeries = new TimeSeries()
        timeSeriesItem1.summary = 40
        timeSeriesItem1.data_set = dataSet

        item1 = new Item()
        item1.date = '2020-12-11'
        item1.value = 15
        item2 = new Item()
        item2.date = '2020-12-12'
        item2.value = 15

        dataSet = [item1, item2]

        const timeSeriesItem2: TimeSeries = new TimeSeries()
        timeSeriesItem2.summary = 30
        timeSeriesItem2.data_set = dataSet

        return  [timeSeriesItem1, timeSeriesItem2]
    }
}
