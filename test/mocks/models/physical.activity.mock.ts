import { PhysicalActivity } from '../../../src/application/domain/model/physical.activity'
import { DefaultFunctions } from '../utils/default.functions'
import { ActivityLevelType, PhysicalActivityLevel } from '../../../src/application/domain/model/physical.activity.level'
import { PhysicalActivityHeartRateZone } from '../../../src/application/domain/model/physical.activity.heart.rate.zone'

export class PhysicalActivityMock {

    public generate(type?: ActivityTypeMock): PhysicalActivity {
        const physicalActivity: PhysicalActivity = new PhysicalActivity()

        if (!type) type = this.chooseType()

        const startTime: Date = new Date(1560826800000 + Math.floor((Math.random() * 1000)))
        const endTime: Date = new Date(new Date(startTime)
            .setMilliseconds(Math.floor(Math.random() * 35 + 10) * 60000))  // 10-45min in milliseconds

        physicalActivity.id = DefaultFunctions.generateObjectId()
        physicalActivity.start_time = startTime.toISOString()
        physicalActivity.end_time = endTime.toISOString()
        physicalActivity.duration = endTime.getTime() - startTime.getTime()
        physicalActivity.user_id = DefaultFunctions.generateObjectId()
        physicalActivity.name = type
        physicalActivity.calories = Math.floor((Math.random() * 20000 + 500)) // 500-20100
        if (type === ActivityTypeMock.WALK || type === ActivityTypeMock.RUN) {
            physicalActivity.steps = Math.floor((Math.random() * 20000 + 100)) // 100-20100
        }
        physicalActivity.distance = Math.floor((Math.random() * 1000 + 100)) // 100-1100
        physicalActivity.levels = this.generatePhysicalActivityLevels()
        physicalActivity.heart_rate_average = Math.floor((Math.random() * 120 + 70)) // 70-189
        physicalActivity.heart_rate_zones = this.generateHeartRateZones()

        return physicalActivity
    }

    private generatePhysicalActivityLevels(): Array<PhysicalActivityLevel> {
        const levels: Array<PhysicalActivityLevel> = []

        const sedentaryLevel: PhysicalActivityLevel = new PhysicalActivityLevel()
        sedentaryLevel.name = ActivityLevelType.SEDENTARY
        sedentaryLevel.duration = Math.floor((Math.random() * 10) * 60000)

        const lightlyLevel: PhysicalActivityLevel = new PhysicalActivityLevel()
        lightlyLevel.name = ActivityLevelType.LIGHTLY
        lightlyLevel.duration = Math.floor((Math.random() * 10) * 60000)

        const fairlyLevel: PhysicalActivityLevel = new PhysicalActivityLevel()
        fairlyLevel.name = ActivityLevelType.FAIRLY
        fairlyLevel.duration = Math.floor((Math.random() * 10) * 60000)

        const veryLevel: PhysicalActivityLevel = new PhysicalActivityLevel()
        veryLevel.name = ActivityLevelType.VERY
        veryLevel.duration = Math.floor((Math.random() * 10) * 60000)

        levels.push(sedentaryLevel)
        levels.push(lightlyLevel)
        levels.push(fairlyLevel)
        levels.push(veryLevel)

        return levels
    }

    private generateHeartRateZones(): PhysicalActivityHeartRateZone {
        const heartRateZonesJSON: any = {
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
        return new PhysicalActivityHeartRateZone().fromJSON(heartRateZonesJSON)
    }

    private chooseType(): ActivityTypeMock {
        switch (Math.floor((Math.random() * 4))) { // 0-3
            case 0:
                return ActivityTypeMock.WALK
            case 1:
                return ActivityTypeMock.RUN
            case 2:
                return ActivityTypeMock.BIKE
            default:
                return ActivityTypeMock.SWIM
        }
    }
}

export enum ActivityTypeMock {
    WALK = 'walk',
    RUN = 'run',
    BIKE = 'bike',
    SWIM = 'swim'
}
