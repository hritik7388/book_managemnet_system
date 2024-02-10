import Mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate";
import status from '../enums/status';
const options = {
    collection: "history",
    timestamps: true
};
const schema = Mongoose.Schema;
var historyModel = new Schema({
    userId: {
        type: schema.Types.ObjectId,
        ref: "user"
    },
    receiverId: {
        type: schema.Types.ObjectId,
        ref: "user"
    },
    collectionId: {
        type: schema.Types.ObjectId,
        ref: "collection"
    },
    nftId: {
        type: schema.Types.ObjectId,
        ref: "nft"
    },
    bookId: {
        type: schema.Types.ObjectId,
        ref: "order"
    },
    bidId: {
        type: schema.Types.ObjectId,
        ref: "bid"
    },
    followerId: {
        type: schema.Types.ObjectId,
        ref: "user"
    },
    title: {
        type: String,
    },
    description: {
        type: String
    },
    quantity:{type:Number},
    type: {
        type: String,
        enum: [    "BOOK_CREATE",  "BOOK_SELL",  ]
    },
    status: { type: String, default: status.ACTIVE },
},
    options
);

historyModel.plugin(mongoosePaginate);
historyModel.plugin(mongooseAggregatePaginate);
module.exports = Mongoose.model("history", historyModel);