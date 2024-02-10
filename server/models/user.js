import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import userType from "../enums/userType";
import status from '../enums/status';
import bcrypt from 'bcryptjs';
const options = {
  collection: "user",
  timestamps: true,
};

const userModel = new Schema(
  { 
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String },
    userName: { type: String },
    email: { type: String }, 
    bio: { type: String },
    mobileNumber: { type: String },
    userType: { type: String, default: userType.USER },  
    password: { type: String }, 
    otp: { type: Number },
    otpTime: { type: Number },
    otpVerification: { type: Boolean, default: false }, 
    referralCode: { type: String }, 
    message: { type: String }, 
    status: { type: String, default: status.ACTIVE },
  },

  options
);
userModel.plugin(mongoosePaginate);
userModel.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("user", userModel);

Mongoose.model("user", userModel).find({ userType: userType.ADMIN }, async (err, result) => {
  if (err) {
    console.log("DEFAULT ADMIN ERROR", err);
  }
  else if (result.length != 0) {
    console.log("Default Admin.");
  }
  else {
    let obj = {
      userType: userType.ADMIN,
      firstName: "Hritik",
      lastName:"Bhadauria",
      countryCode: "+91",
      mobileNumber: "7388503329",
      email: "choreohritik52@gmail.com", 
      dateOfBirth: "20/08/2001",
      gender: "Male",
      password: bcrypt.hashSync("Mobiloitte@1"),
      address: "Kannauj, UP, India",
      userName:"Hritik Bhadauria" 
    };
    Mongoose.model("user", userModel).create(obj, async (err1, result1) => {
      if (err1) {
        console.log("DEFAULT ADMIN  creation ERROR", err1);
      } else {
        console.log("DEFAULT ADMIN Created", result1);
      }
    });
  }
});




