import Mongoose, { Schema } from "mongoose";
import status from '../enums/status';
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
const options = {
    collection: "notification",
    timestamps: true
};

const noficationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        receiverId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        }, 
        title: {
            type: String
        },
        description: {
            type: String
        }, 
        notificationType: {
            type: String
        },
        quantity: { type: Number },
        isRead: {
            type: Boolean,
            default: false
        },
        status: { type: String, default: status.ACTIVE }
    },
    options
);

noficationSchema.plugin(mongoosePaginate);
noficationSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("notification", noficationSchema);


