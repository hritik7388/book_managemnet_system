import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import { FieldValueList } from "twilio/lib/rest/autopilot/v1/assistant/fieldType/fieldValue";
const options = {
    collection: "order",
    timestamps: true
};
const schema = Mongoose.Schema;
var orderSchema = new schema(
    {
        userId: {
            type: schema.Types.ObjectId,
            ref: 'user'
        },
        currentOwner: {
            type: schema.Types.ObjectId,
            ref: 'user'
        },
        creatorId: {
            type: schema.Types.ObjectId,
            ref: 'user'
        },
 
        currentOwner: {
            type: schema.Types.ObjectId,
            ref: 'user'
        },
 
 
        buyerId: {
           
            type: schema.Types.ObjectId,
            ref: 'user'
        },
        sellerId: {
            type: schema.Types.ObjectId,
            ref: 'user'
        },
 
        description: {
            type: String
        },
 
 
 
        rating: [{
            userId: {
                type: schema.Types.ObjectId,
                ref: 'user'
            },
            rating: {
                type: Number,
                default: 0,
                max: 5,
            },
            comment: {
                type: String
            }
        }],
        time: {
            type: String
        },
 
        description: {
            type: String
        },
      
        price: {
            type: Number
        },
 
        startTime: {
            type: String
        },
        endTime: {
            type: String
        },
 
 
        sellCount: {
            type: Number, default: 0
        },
 
        isCreated: {
            type: Boolean
        },
 
        quantity: {
            type: Number,
            default: 0,
        },
 

 

        saleType: {
            type: String,
            enum: ["ONSALE", "OFFSALE"],
            default: "ONSALE"
        },
        sellStatus: { type: String },
        orderType: {
            type: String,
             
            default: "BOOK"
        },
     
   
    
        status: {
            type: String,
            enum: ["ACTIVE", "BLOCK", "DELETE", "CANCEL"],
            default: "ACTIVE"
        },
 
    },
    options
);

orderSchema.plugin(mongoosePaginate);
orderSchema.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("order", orderSchema);
