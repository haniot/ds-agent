import { Fitbit } from '../../../src/application/domain/model/fitbit'
import { DefaultFunctions } from '../utils/default.functions'

export class FitbitMock {

    public generate(hasLastSync?: boolean, hasError?: boolean, hasTimestamp?: boolean): Fitbit {
        const fitbit: Fitbit = new Fitbit()
        fitbit.user_id = DefaultFunctions.generateObjectId()
        if (hasLastSync) fitbit.last_sync = DefaultFunctions.generateDate()
        if (hasError) {
            fitbit.error = {
                'code': 1500,
                'message': 'An error occurred with the Fitbit Web API while processing the request.',
                'description': 'Try your request later.'
            }
        }
        if (hasTimestamp) fitbit.timestamp = DefaultFunctions.generateDate()

        return fitbit
    }
}
