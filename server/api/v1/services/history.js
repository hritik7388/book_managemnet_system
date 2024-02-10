
import historyModel from "../../../models/history";
import status from '../../../enums/status';

const historyServices = {

    createHistory: async (insertObj) => {
        return await historyModel.create(insertObj);
    },

    findHistory: async (query) => {
        return await historyModel.findOne(query);
    },

    updateHistory: async (query, updateObj) => {
        return await historyModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    historyList: async () => {
        return await historyModel.find({});
    },

    paginateUserOwendHistory: async (userId, validatedBody) => {
        let query = { userId: userId, status: { $ne: status.DELETE } };
        const { page, limit } = validatedBody;
        if (validatedBody.page) {
            query.page = validatedBody.page
        }
        if (validatedBody.limit) {
            query.limit = validatedBody.limit
        }
        let options = {
            page: page || 1,
            limit: limit || 15,
            sort: { createdAt: -1 },
            populate: [{ path: "nftId", populate: { path: 'userId', } }, { path: 'userId' }, { path: 'followingUserId' }]
        };
        return await historyModel.paginate(query, options);
    },

    paginateShowNftHistory: async (validatedBody) => {
        const { _id, search, page, limit } = validatedBody;
        let query = { status: { $ne: status.DELETE } };
        if (_id) {
            query.nftId = _id;
        }
        if (search) {
            query.type = { $regex: search, $options: 'i' }
        }
        let options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 15,
            sort: { createdAt: -1 },
            populate: [
                { path: "nftId", populate: { path: 'userId', } },
                { path: 'userId' },
                { path: 'followerId' },
                { path: 'bidId', populate: { path: 'nftId' } },
                { path: 'collectionId', populate: { path: 'userId', } },
                { path: 'bookId', populate: { path: 'nftId' } },
            ]
        };
        return await historyModel.paginate(query, options);
    },

    paginateHistory: async (validatedBody) => {
        let query = { status: { $ne: status.DELETE } };
        const { search, fromDate, toDate, page, limit } = validatedBody;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { tokenId: { $regex: search, $options: 'i' } },
            ]
        }
        if (validatedBody.status) {
            query.status = validatedBody.status
        }
        if (fromDate && !toDate) {
            query.createdAt = { $gte: fromDate };
        }
        if (!fromDate && toDate) {
            query.createdAt = { $lte: toDate };
        }
        if (fromDate && toDate) {
            query.$and = [
                { createdAt: { $gte: fromDate } },
                { createdAt: { $lte: toDate } },
            ]
        }
        let options = {
            page: page || 1,
            limit: limit || 15,
            sort: { createdAt: -1 },
            populate: { path: "_id nftId" }
        };
        return await historyModel.paginate(query, options);
    }

}

module.exports = { historyServices };
