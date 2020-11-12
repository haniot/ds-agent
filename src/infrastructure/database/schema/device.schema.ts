import Mongoose from 'mongoose'

interface IDeviceSchemaModel extends Mongoose.Document {
}

const deviceSchema = new Mongoose.Schema({
        name: String,
        address: String,
        type: String,
        last_sync: String,
        patient_id: String
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
        toJSON: {
            transform: (doc, ret) => {
                ret.id = ret._id
                delete ret._id
                delete ret.__v
                return ret
            }
        }
    }
)

export const DeviceRepoModel = Mongoose.model<IDeviceSchemaModel>('Device', deviceSchema)
