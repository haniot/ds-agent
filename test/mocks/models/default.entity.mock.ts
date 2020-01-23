import { LogType } from '../../../src/application/domain/utils/log.type'
import { ActivityLevelType } from '../../../src/application/domain/model/physical.activity.level'
import { SleepType } from '../../../src/application/domain/model/sleep'
import moment from 'moment'
import { TokenManager } from '../utils/token.manager'

export abstract class DefaultEntityMock {
    public static ACTIVITY: any = {
        id: '5d7a4c7d7b997bdf7601dcec',
        start_time: '2019-09-12T13:36:49.741Z',
        end_time: '2019-09-12T13:06:49.741Z',
        duration: 1800000,
        patient_id: '5d7a4a95c292db05e4f765a8'
    }

    public static PAYLOAD: any = {
        aud: 'A1B23C',
        sub: 'ABC123',
        iss: 'Fitbit',
        typ: 'access_token',
        scopes: 'ract rsle rwei',
        exp: parseInt(`${moment().add(1, 'hour').valueOf() / 1000}`, 10),
        iat: parseInt(`${moment().subtract(7, 'hour').valueOf() / 1000}`, 10)
    }

    public static FITBIT_AUTH_DATA: any = {
        access_token: TokenManager.generateToken(DefaultEntityMock.PAYLOAD),
        expires_in: DefaultEntityMock.PAYLOAD.exp,
        refresh_token: 'd6ccf77f84d342267f9f011d2e16fb9e',
        scope: 'ract rsle rwei',
        token_type: 'Bearer',
        user_id: 'ABC123',
        last_sync: '2019-09-12T13:36:49.741Z',
        status: 'valid_token'
    }

    public static FITBIT_AUTH_DATA_BEFORE: any = {
        access_token: TokenManager.generateToken(DefaultEntityMock.PAYLOAD),
        expires_in: (DefaultEntityMock.PAYLOAD.exp - 300),
        refresh_token: 'd6ccf77f84d342267f9f011d2e16fb9e',
        scope: 'ract rsle rwei',
        token_type: 'Bearer',
        user_id: 'ABC123',
        last_sync: '2019-09-12T13:36:49.741Z',
        status: 'valid_token'
    }

    public static USER_AUTH_DATA: any = {
        id: '5d7aa5125b593e3f113d190f',
        user_id: '5d7a4a95c292db05e4f765a8',
        fitbit: DefaultEntityMock.FITBIT_AUTH_DATA
    }

    public static USER_AUTH_DATA_BEFORE: any = {
        id: '5d7aa5125b593e3f113d190f',
        user_id: '5d7a4a95c292db05e4f765a8',
        fitbit: DefaultEntityMock.FITBIT_AUTH_DATA_BEFORE
    }

    public static LOG: any = {
        date: '2019-09-12',
        value: 2,
        type: LogType.CALORIES,
        patient_id: '5d7a4a95c292db05e4f765a8'
    }

    public static USER_LOG: any = {
        steps: [{ ...DefaultEntityMock.LOG, type: LogType.STEPS }],
        calories: [{ ...DefaultEntityMock.LOG, type: LogType.CALORIES }],
        active_minutes: [{ ...DefaultEntityMock.LOG, type: LogType.ACTIVE_MINUTES }],
        lightly_active_minutes: [{ ...DefaultEntityMock.LOG, type: LogType.LIGHTLY_ACTIVE_MINUTES }],
        sedentary_minutes: [{ ...DefaultEntityMock.LOG, type: LogType.SEDENTARY_MINUTES }]
    }

    public static MEASUREMENT: any = {
        id: '5d7a83720edb8097a73421ce',
        type: 'measurement',
        timestamp: '2019-09-12T13:36:49.741Z',
        value: 0,
        unit: 'unit',
        patient_id: '5d7a4a95c292db05e4f765a8'
    }

    public static BODY_FAT: any = {
        ...DefaultEntityMock.MEASUREMENT,
        type: 'body_fat',
        value: 20,
        unit: '%'
    }

    public static WEIGHT: any = {
        ...DefaultEntityMock.MEASUREMENT,
        type: 'weight',
        value: 60,
        unit: 'kg',
        body_fat: 20
    }

    public static FITBIT_WEIGHT: any = {
        date: '2019-09-12',
        weight: 60,
        fat: 20,
        resourceId: '5d7a9fc8d3f5bbb30e0d6a1f'
    }

    public static HEART_RATE_ZONE: any = {
        min: 80,
        max: 100,
        calories: [undefined],
        duration: 1000
    }

    public static PHYSICAL_ACTIVITY_HEART_RATE: any = {
        average: 90,
        out_of_range_zone: DefaultEntityMock.HEART_RATE_ZONE,
        fat_burn_zone: DefaultEntityMock.HEART_RATE_ZONE,
        cardio_zone: DefaultEntityMock.HEART_RATE_ZONE,
        peak_zone: DefaultEntityMock.HEART_RATE_ZONE
    }

    public static PHYSICAL_ACTIVITY_LEVEL: any = {
        name: ActivityLevelType.FAIRLY,
        duration: 1000
    }

    public static PHYSICAL_ACTIVITY: any = {
        ...DefaultEntityMock.ACTIVITY,
        name: 'Walk',
        calories: 200,
        steps: 1000,
        distance: 1000,
        levels: [DefaultEntityMock.PHYSICAL_ACTIVITY_LEVEL],
        heart_rate_average: [undefined],
        calories_link: DefaultEntityMock.buildLink('calories', DefaultEntityMock.ACTIVITY.patient_id,
            DefaultEntityMock.ACTIVITY.start_time, DefaultEntityMock.ACTIVITY.end_time),
        heart_rate_link: DefaultEntityMock.buildLink('heart_rate', DefaultEntityMock.ACTIVITY.patient_id,
            DefaultEntityMock.ACTIVITY.start_time, DefaultEntityMock.ACTIVITY.end_time),
        heart_rate_zones: {
            cardio: {
                calories: [undefined],
                duration: 1000,
                max: 100,
                min: 80
            },
            fat_burn: {
                calories: [undefined],
                duration: 1000,
                max: 100,
                min: 80
            },
            out_of_range: {
                calories: [undefined],
                duration: 1000,
                max: 100,
                min: 80
            },
            peak: {
                calories: [undefined],
                duration: 1000,
                max: 100,
                min: 80
            }
        }
    }

    public static RESOURCE: any = {
        id: '5d7a9fc8d3f5bbb30e0d6a1e',
        resource: { logId: '171847684' },
        date_sync: '2019-09-12T13:36:49.741Z',
        user_id: '5d7a4a95c292db05e4f765a8',
        provider: 'Fitbit'
    }

    public static SLEEP_PATTERN_SUMMARY_DATA: any = {
        count: 10,
        duration: 10000
    }

    public static SLEEP_PATTERN_STAGES_SUMMARY_JSON: any = {
        deep: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA,
        light: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA,
        rem: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA,
        awake: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA
    }

    public static SLEEP_PATTERN_STAGES_SUMMARY: any = {
        deep: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA,
        light: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA,
        rem: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA,
        wake: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA
    }

    public static SLEEP_PATTERN_PHASES_SUMMARY: any = {
        awake: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA,
        asleep: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA,
        restless: DefaultEntityMock.SLEEP_PATTERN_SUMMARY_DATA
    }

    public static SLEEP_PATTERN_DATA_SET: any = {
        start_time: '2019-09-12T13:36:49.741Z',
        name: 'asleep',
        duration: 10000
    }

    public static SLEEP_PATTERN_PHASES: any = {
        data_set: [DefaultEntityMock.SLEEP_PATTERN_DATA_SET],
        summary: DefaultEntityMock.SLEEP_PATTERN_PHASES_SUMMARY
    }

    public static SLEEP_PATTERN_STAGES: any = {
        data_set: [DefaultEntityMock.SLEEP_PATTERN_DATA_SET],
        summary: DefaultEntityMock.SLEEP_PATTERN_STAGES_SUMMARY
    }

    public static SLEEP: any = {
        ...DefaultEntityMock.ACTIVITY,
        pattern: DefaultEntityMock.SLEEP_PATTERN_PHASES,
        type: SleepType.CLASSIC
    }

    public static USER_IDS: any = {
        does_not_exists: '5d7fb75ae48591c21a793f70',
        does_not_saved: '5d7fd15c3e86dd635cc12767',
        expired_token: '5d926e4ebb567ba877a0ee5e',
        invalid_token: '5d9270f07d06332a5541d8aa',
        client_error: '5d927225f8f8b947e0766bb6',
        any_fitbit_error: '5d9272ba888cb686ed99d952',
        patient_id: '5d7a4a95c292db05e4f765a8'
    }

    public static FITBIT_USER_IDS: any = {
        does_not_saved: 'XXYYXX'
    }

    public static CHILD: any = {
        id: '5d7a4a95c292db05e4f765a8',
        username: 'BR0009',
        institution_id: '5d7bb0c519cc1c00126ca689',
        gender: 'male',
        age: 9
    }

    public static LOG_SYNC: any = {
        calories: 1,
        steps: 1,
        active_minutes: 1,
        lightly_active_minutes: 1,
        sedentary_minutes: 1
    }

    public static DATA_SYNC: any = {
        activities: 1,
        sleep: 1,
        weights: 1,
        intraday: {
            active_minutes: [undefined],
            calories: [undefined],
            distance: [undefined],
            heart_rate: [undefined],
            steps: [undefined]
        },
        timeseries: {
            active_minutes: [undefined],
            calories: [undefined],
            distance: [undefined],
            heart_rate: [undefined],
            steps: [undefined]
        }
    }

    private static buildLink(type: string, patientId: string, startTime: string, endTime: string): string {
        if (!patientId || !startTime || !endTime) return ''
        const startDate: string = startTime.split('T')[0]
        const endDate: string = endTime.split('T')[0]

        const startTimestamp: Date = new Date(startTime)
        const endTimestamp: Date = new Date(endTime)
        const _startTime = `${startTimestamp.getHours().toString().padStart(2, '0')}:`
            .concat(`${startTimestamp.getMinutes().toString().padStart(2, '0')}:`)
            .concat(`${startTimestamp.getSeconds().toString().padStart(2, '0')}`)
        const _endTime = `${endTimestamp.getHours().toString().padStart(2, '0')}:`
            .concat(`${endTimestamp.getMinutes().toString().padStart(2, '0')}:`)
            .concat(`${endTimestamp.getSeconds().toString().padStart(2, '0')}`)

        return `/v1/patients/${patientId}/${type}/date/${startDate}/${endDate}`
            .concat(`/time/${_startTime}/${_endTime}/interval/${type === 'heart_rate' ? '1s' : '1m'}/timeseries`)

    }
}
