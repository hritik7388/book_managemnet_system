import Mongoose, { Schema } from "mongoose";
import status from '../enums/status';
const options = {
    collection: "otp",
    timestamps: true
};

const schemaDefination = new Schema(
    {
        otp: { type: String },
        otpTime: { type: Number },
        otp_status: { type: Boolean, default: false },
        userId: { type: Mongoose.Types.ObjectId, ref: 'user' },
        status: { type: String, default: status.ACTIVE }
    },
    options
);
module.exports = Mongoose.model("otp", schemaDefination);