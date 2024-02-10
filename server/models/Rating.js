import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import { FieldValueList } from "twilio/lib/rest/autopilot/v1/assistant/fieldType/fieldValue";
const options = {
    collection: "feedBack",
    timestamps: true
};
const schema = Mongoose.Schema;
var feedBackSchema = new schema(
    {
        userId: {
            type: schema.Types.ObjectId,
            ref: 'user'
        },

        bookId: {
            type: schema.Types.ObjectId,
            ref: 'order'
        },
        rating: {
            type: Number,
            default: 0,
            max: 5,
        },
        comment: {
            type: String
        },


        status: {
            type: String,
            enum: ["ACTIVE", "BLOCK", "DELETE"],
            default: "ACTIVE"
        }
    },
    options
);

feedBackSchema.plugin(mongoosePaginate);
feedBackSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("feedBack", feedBackSchema);
