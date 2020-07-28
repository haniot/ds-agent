import { ValidationException } from '../exception/validation.exception'
import { ResourceType } from '../utils/resource.type'

export class ResourceDataTypeValidator {
    public static validate(type: ResourceType): void | ValidationException {
        if (!(Object.values(ResourceType).includes(type))) {
            throw new ValidationException(`Value not mapped for resource data type: ${type}`,
                `The mapped values are: ${Object.values(ResourceType).join(',')}.`)
        }
    }
}
