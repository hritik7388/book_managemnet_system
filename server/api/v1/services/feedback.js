
import feedBackModel from "../../../models/Rating";


const feedbackServices = {

    createFeedback: async (insertObj) => {
        return await feedBackModel.create(insertObj);
    },

    findFeedback: async (query) => {
        return await feedBackModel.findOne(query);
    },

    updateFeedback: async (query, updateObj) => {
        return await feedBackModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    FeedbackListWithoutPagination: async (query) => {
        return await feedBackModel.find(query).populate("userId bookId");
    },


    FeedbackList: async (validatedBody) => {

        let query = { status: "ACTIVE" };
        const { fromDate, page, limit, toDate, } = validatedBody;
       
   
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
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 15,
          sort: { createdAt: -1 },
          populate: "userId nftId"
        };
        return await feedBackModel.paginate(query, options);
      },





}

module.exports = { feedbackServices };
