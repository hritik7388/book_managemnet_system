
import notificationModel from "../../../models/notification";
import status from "../../../enums/status";


const notificationServices = {

    createNotification: async (insertObj) => {
        return await notificationModel.create(insertObj);
    },

    findNotification: async (query) => {
        return await notificationModel.findOne(query);
    },

    updateNotification: async (query, updateObj) => {
        return await notificationModel.findOneAndUpdate(query, updateObj, { new: true });
    },

    deleteAllNotification: async (query) => {
        return await notificationModel.deleteMany(query);
    },

    multiUpdateNotification: async (query, updateObj) => {
        return await notificationModel.updateMany(query, updateObj, { multi: true });
    },

    notificationList: async (query) => {
        return await notificationModel.find(query);
    },

    notificationListWithSort: async (query) => {
        return await notificationModel.find(query)
            .populate('userId')
            .sort({ createdAt: -1 })
            .limit(10);
    },
    sortNotificationPagination: async (validatedBody) => {
        try {
            let query = { status: { $ne: status.DELETE } };
            const { userId, page, limit , notificationType } = validatedBody;
    
            if (userId) {
                query.userId = userId;
            }
            if (notificationType) {
                query.notificationType = notificationType;
            }
            let options = {
                page: parseInt(page, 10) || 1,
                limit: parseInt(limit, 10) || 10,
                sort: { createdAt: -1 }
            };
    
            const result = await notificationModel.paginate(query, options);
    
            // Calculate the total pages count
            const totalPages = Math.ceil(result.total / options.limit);
    
            // Add the total pages count to the result object
            result.totalPages = totalPages;
    
            return result;
        } catch (error) {
            // Handle errors here, log them, or throw a custom error
            console.error('Pagination error:', error);
            throw new Error('Error during pagination');
        }
    },
    

}

module.exports = { notificationServices };
