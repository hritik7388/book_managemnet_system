import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import { FieldValueList } from "twilio/lib/rest/autopilot/v1/assistant/fieldType/fieldValue";
const options = {
    collection: "payment",
    timestamps: true
};
const schema = Mongoose.Schema;
const paymentSchema = new Schema({
    cardNumber: String,
    expireMonth: String,
    expireYear: String,
    cvc: String,
    price: String,
    bookId: String,
    userId: String,
    approveStatus: String,
    paymentType: String,
}, 
    options
);

paymentSchema.plugin(mongoosePaginate);
paymentSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("payment", paymentSchema);
