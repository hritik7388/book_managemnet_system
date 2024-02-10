
import orderModel from "../../../models/Book"; 
import status from '../../../enums/status';
import mongoose from "mongoose";

const orderServices = {

  createOrder: async (insertObj) => {
    return await orderModel.create(insertObj);
  },
  findOrder: async (query) => {
    return await orderModel.findOne(query)
      .populate('bidId userId collectionId currentOwner creatorId')
      .populate({
        path: 'nftId',
        populate: [
          { path: 'userId' },
          { path: 'brandId' }
        ]
      });
  },
  findTopSeller: async (query) => {
    return await orderModel.aggregate(query)
  },
  findOneOrder: async (_id) => {
    let query = { _id: _id, status: status.ACTIVE }
    return await orderModel.findOne(query).populate([{ path: 'bidId', populate: { path: 'userId' } }, { path: 'nftId' }, { path: 'nftId', populate: { path: 'currentOwnerId' } }, { path: 'nftId', populate: { path: 'userId' } }, { path: 'currentOwner' }, { path: 'userId' }, { path: 'collectionId' }, { path: 'creatorId' }])
  },

  findOnePhysicalOrder: async (_id) => {
    try {
      let query = { _id: _id, status: status.ACTIVE };
      let nftRes = await nftModel.findOne(query);
      let query1 = { status: status.ACTIVE };
      if (nftRes.isCreated === true && nftRes.isPlace === true) {
        query1["nftId"] = nftRes._id;
      } else {
        query1["nftId"] = nftRes.nftId;
      }
      // if (nftRes.isCreated === false && nftRes.isPlace === true)

      return await orderModel.findOne(query1).populate([{ path: 'bidId', populate: { path: 'userId' } }, { path: 'nftId' }, { path: 'nftId', populate: { path: 'currentOwnerId' } }, { path: 'nftId', populate: { path: 'userId' } }, { path: 'currentOwner' }, { path: 'userId' }, { path: 'collectionId' }, { path: 'creatorId' }]);
    } catch (error) {
      console.log("error==>>", error);
      throw error;
    }

  },


  findOrderWithPopulate: async (id) => {
    let query = { _id: mongoose.Types.ObjectId(`${id}`), status: status.ACTIVE }
    return await orderModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "userId"
        }
      },
      {
        $lookup: {
          from: "user",
          localField: "currentOwner",
          foreignField: "_id",
          as: "currentOwner"
        }
      },
      {
        $lookup: {
          from: "bid",
          as: "bidId",
          let: {
            bid_id: "$_id"
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$$bid_id", "$bookId"] },
              }
            },
            {
              $lookup: {
                from: "user",
                localField: "userId",
                foreignField: "_id",
                as: "userId"
              }
            }
          ],
        }
      },
      {
        $lookup: {
          from: "collection",
          localField: "collectionId",
          foreignField: "_id",
          as: "collectionId"
        }
      },
      {
        $lookup: {
          from: "nft",
          localField: "nftId",
          foreignField: "_id",
          as: "nftId"
        }
      },
      { $sort: { createdAt: -1 } }
    ])
  },

  updateOrder: async (query, updateObj) => {
    return await orderModel.findOneAndUpdate(query, updateObj, { new: true });
  },

  updateOrderById: async (query, updateObj) => {
    return await orderModel.findByIdAndUpdate(query, updateObj, { new: true });
  },

  orderList: async (query) => {
    return await orderModel.find(query).sort({ createdAt: -1 }).populate([{ path: 'bookId userId collectionId currentOwner buyerId sellerId' }]);
  },

  orderListWithSearch: async (validatedBody) => {
    try {
      let query = {
        sellStatus: { $ne: "SOLD" }, saleType: "ONSALE", isReported: { $ne: true }, status: status.ACTIVE, $or: [{ endTime: { $gte: new Date().getTime() } }, { endTime: "" }]
      };
      const { search, network, itemCategory, collection, min, max, page, limit, mostVisited, mostFavorited, mostSold, oldest, newest, endingSoon, price, recentalyMinted, recentalyTraded, nftType } = validatedBody;
      if (search) {
        query.$or = [
          { network: { $regex: search, $options: 'i' } },
          { tokenId: { $regex: search, $options: 'i' } },
          { itemCategory: { $regex: search, $options: 'i' } },
          { mediaUrl: { $regex: search, $options: 'i' } },
          { mediaType: { $regex: search, $options: 'i' } },
          { tokenName: { $regex: search, $options: 'i' } },
          { royalties: { $regex: search, $options: 'i' } }
        ]
      }
      if (nftType) {
        query.nftType = nftType;
      }
      if (network) {
        query.network = { $in: network };
      }

      if (itemCategory) {
        query.itemCategory = { $in: itemCategory };
      }
      if (collection) {
        query.collectionId = { $in: collection };
      }
      if (min && !max) {
        query.price = { $gte: min };
      }
      if (!min && max) {
        query.price = { $lte: max };
      }
      if (min && max) {
        query.$and = [
          { price: { $gte: min } },
          { price: { $lte: max } },
        ]
      }
      let options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        populate: [{ path: 'nftId', populate: { path: 'userId brandId' } }, { path: 'userId' }, { path: 'currentOwner' }, { path: 'collectionId' }, { path: 'bidId' }],
        sort: {}
      };
      if (mostVisited) {
        mostVisited === true ? options.sort = { visitCount: -1 } : options;
      }
      if (recentalyMinted) {
        recentalyMinted === true ? options.sort = { createdAt: -1 } : { createdAt: 1 };
      }
      if (mostSold) {
        mostSold === true ? options.sort = { sellCount: -1 } : options;
      }
      if (oldest) {
        oldest === true ? options.sort = { createdAt: 1 } : options;
      }
      if (newest) {
        newest === true ? options.sort = { createdAt: -1 } : options;
      }
      if (endingSoon) {
        endingSoon === true ? options.sort = { endDate: -1 } : options;
      }
      if (price) {
        price === "High" ? options.sort = { price: -1 } : { price: 1 };
      }
      if (recentalyTraded) {
        recentalyTraded === true ? options.sort = { updatedAt: -1 } : options;
      }
      Object.keys(options.sort).length == 0 ? options.sort["createdAt"] = -1 : options.sort;

      if (mostFavorited === true) {
        try {
          let aggr = orderModel.aggregate([
            { $match: query },
            {
              $lookup: {
                from: "nft",
                as: "nftId",
                let: {
                  nft_id: "$nftId",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$$nft_id", "$_id"] }
                    }
                  },

                  {
                    $lookup: {
                      from: "brand",
                      localField: "brandId",
                      foreignField: "_id",
                      as: "brandId"
                    }
                  },
                  {
                    $lookup: {
                      from: "user",
                      localField: "userId",
                      foreignField: "_id",
                      as: "userId"
                    }
                  },
                  {
                    $lookup: {
                      from: "user",
                      localField: "currentOwnerId",
                      foreignField: "_id",
                      as: "currentOwnerId"
                    }
                  },
                  {
                    $lookup: {
                      from: "user",
                      localField: "ownerHistory.userId",
                      foreignField: "_id",
                      as: "ownerHistory"
                    }
                  }
                ],
              }
            },
            {
              $unwind: "$nftId"
            },
            {
              $lookup: {
                from: "user",
                localField: "userId",
                foreignField: "_id",
                as: "userId"
              }
            },
            {
              $lookup: {
                from: "user",
                localField: "currentOwner",
                foreignField: "_id",
                as: "currentOwner"
              }
            },
            {
              $unwind: "$userId"
            },
            { $addFields: { length: { $size: "$likesUsers" } } },
            { $sort: { length: -1 } }
          ]);
          return await orderModel.aggregatePaginate(aggr, {
            page: page || 1,
            limit: limit || 10
          });
        } catch (e) {
        }
      } else {
        return orderModel.paginate(query, options);
      }
    } catch (error) {
      console.log("error==124===>>", error);
    }

  },



  collectionOrderList: async (query) => {
    query.isReported = { $ne: true };
    // query.sellStatus = { $ne: "SOLD" };
    query.saleType = { $ne: "OFFSALE" }
    return await orderModel.find(query).sort({ createdAt: -1 }).populate([{ path: 'nftId userId currentOwner bidId' }]);
  },

  orderPaginateSearch: async (validatedBody) => {
    let query = { status: status.ACTIVE, isReported: { $ne: true }, endTime: { $gte: new Date().getTime() } };
    const { search, fromDate, toDate, page, limit } = validatedBody;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { symbol: { $regex: search, $options: 'i' } },
        { itemCategory: { $regex: search, $options: 'i' } }
      ]
    }
    let options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: { createdAt: -1, treandingNftCount: -1 }
    };
    return await nftModel.paginate(query, options);
  },

  paginateOrder: async (validatedBody) => {

    let query = { status: status.ACTIVE, isReported: { $ne: true }, endTime: { $gte: new Date().getTime() } };
    console.log("==query==", query)
    const { search, fromDate, page, limit, toDate, } = validatedBody;
    if (search) {
      query.$or = [
        { itemCategory: { $regex: search, $options: 'i' } },
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
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 15,
      sort: { createdAt: -1 },
      populate: [{ path: "nftId", select: "-uri" }, { path: "userId" }, { path: "sellerId" }, { path: "bidId" }, { path: "collectionId" }, { path: "buyerId" }, { path: "currentOwner" }],
    };
    return await orderModel.paginate(query, options);
  },

  dowloadPrivateUrl1: async (query, walletAddress) => {
    return await orderModel.findOne(query).populate({ path: "nftId", match: { $or: [{ recipientWalletAddress: walletAddress } || { recipientBackupWalletAddress: walletAddress }] }, select: "uri" }).select("nftId")
  },

  dowloadPrivateUrl: async (query, userId, walletAddress) => {
    return await orderModel.findOne(query).populate({
      path: "nftId",
      $match: {
        $or: [{ userId: { $eq: userId } }, { recipientWalletAddress: { $eq: walletAddress } }, { recipientBackupWalletAddress: { $eq: walletAddress } }]
      }
    }).select("uri")

    //     match:{
    //  $or:[{userId:userId},{recipientWalletAddress: walletAddress }, { recipientBackupWalletAddress: walletAddress }]}, select: "uri" })
  },





  findHotOrder: async (query) => {
    query.isReported = { $ne: true };
    return await orderModel.find(query).sort({ createdAt: -1 }).populate([{
      path: "bidId",
      populate: { path: 'bidderId' }
    }, { path: 'nftId' }, { path: 'collectionId' }, { path: 'userId' }]);
  },

  hotOrderList: async (query) => {
    query.sellStatus = { $ne: "SOLD", endTime: { $gte: new Date().getTime() } };
    query.saleType = "ONSALE";
    query.isReported = { $ne: true };
    return await orderModel.find(query).sort({ createdAt: -1 }).populate([{ path: 'nftId', populate: { path: 'userId collectionId currentOwnerId' } }, { path: 'userId' }, { path: 'currentOwner' }]).sort({ bidCount: -1 });
  },



  multiUpdate: async (updateObj) => {
    return await orderModel.updateMany({}, updateObj, { multi: true });
  },

  findOrderLike: async (userId) => {
    let query = { likesUsers: { $in: [userId] }, isReported: { $ne: true }, status: status.ACTIVE };
    return await orderModel.find(query).sort({ createdAt: -1 }).populate([{ path: 'userId' }, { path: 'collectionId' }, { path: 'nftId' }, { path: 'currentOwner' }]);
  },

  findOrderFavourate: async (userId) => {
    let query = { nftType: { $ne: "PHYSICAL" }, favouriteUsers: { $in: [userId] }, isReported: { $ne: true }, status: status.ACTIVE };
    return await orderModel.find(query).sort({ createdAt: -1 }).populate([{ path: 'userId' }, { path: 'collectionId' }, { path: 'nftId' }, { path: 'currentOwner' }]);
  },






  //***************************************flow change as per requirement March 10,2022 *****************************/

  paginateUserOrder: async (userId) => {
    let query = {
      endTime: { $gte: new Date().getTime() },
      saleType: "ONSALE",
      $and: [
        { userId: userId },
        { isReported: { $ne: true } },
        { status: status.ACTIVE },
        { isCreated: true },
        { nftType: { $ne: "PHYSICAL" } },
      ]
    };
    let data = await orderModel.find(query).sort({ createdAt: -1 }).populate([{ path: 'nftId', populate: { path: 'userId' } }, 'userId bidId collectionId buyerId currentOwner'])
      .select('-likesUsers -bidCount -visitCount -sellCount -isCancel -isCreated');
    return data;
    // return data.filter(
    //   (i) => i.sellerId ? (i.sellerId && i.sellerId._id === userId) ? i.buyerId : i.buyerId : data
    // );
  }, // userCreatedCount


  userBuyAndCreatedList: async (userId) => {
    let query = { nftType: { $ne: "PHYSICAL" }, userId: userId, saleType: "ONSALE", isReported: { $ne: true }, status: status.ACTIVE, };
    // let query2 = { userId: userId, isCreated: false, isReported: { $ne: true }, status: status.ACTIVE };
    // const queryData = async (query) => {
    return await orderModel.find(query).sort({ createdAt: -1 }).populate([{ path: 'userId' }, { path: 'nftId', populate: { path: "userId" } }, { path: 'bidId' }, { path: 'collectionId' }, { path: 'buyerId' }, { path: 'currentOwner' }, { path: 'sellerId' }])
      .select('-likesUsers -bidCount -visitCount -sellCount -isCancel');
    // }
    // var [allCreatedList, allBuyList] = await Promise.all([queryData(query1), queryData(query2)]);
    // return {
    //   createdData: allCreatedList,
    //   buyList: allBuyList
    // }
  }, // userBuyAndCreatedList

  userBuyList: async (userId) => {
    let query = { userId: userId, isCreated: false, isReported: { $ne: true }, status: status.ACTIVE };
    return await orderModel.find(query).sort({ createdAt: -1 }).populate('userId nftId bidId collectionId sellerId buyerId currentOwner')
      .select('-likesUsers -bidCount -visitCount -sellCount -isCancel -isCreated');

  }, // userBuyList

  paginateUserOnSaleOrder: async (userId, validatedBody) => {
    let query = { nftType: { $ne: "PHYSICAL" }, userId: userId, saleType: "ONSALE", status: status.ACTIVE, isReported: { $ne: true }, isCancel: false, endTime: { $gte: new Date().getTime() } };
    const { page, limit } = validatedBody;
    let options = {
      page: page || 1,
      limit: limit || 15,
      sort: { createdAt: -1 },
      populate: { path: "userId nftId bidId collectionId sellerId buyerId currentOwner", populate: { path: 'userId' } }
    };
    return await orderModel.paginate(query, options);
  }, // userOnSaleCount



  paginateUserOwendOrder: async (userId) => {
    let query = { nftType: { $ne: "PHYSICAL" }, userId: userId, isCreated: false, isDeleted: { $ne: true }, isReported: { $ne: true }, status: status.ACTIVE };
    console.log("===query==>>", userId);
    return await orderModel.find(query).sort({ createdAt: -1 }).populate([{ path: 'nftId', populate: { path: 'userId' } }, { path: 'collectionId' }, 'userId bidId collectionId sellerId buyerId currentOwner'])
      .select('-likesUsers -bidCount -visitCount -sellCount -isCancel');
  }, // userOwendCount

  paginateSoldOrder: async (userId) => {
    let query = { userId: userId, sellStatus: "SOLD", isCreated: true, isReported: { $ne: true }, status: status.ACTIVE };
    return await orderModel.find(query).sort({ createdAt: -1 }).populate('userId nftId bidId collectionId buyerId sellerId currentOwner')
      .select('-likesUsers -bidCount -visitCount -sellCount -isCancel -isCreated');
    // }
  }, // nftSoldCount

  volumeTradeNFT: async () => {
    try {
      let totalAmount = 0;
      let query = { sellStatus: "SOLD" }
      let orderRes = await orderModel.find(query)
      if (orderRes.length != 0) {
        for (let value of orderRes) {
          totalAmount += value.price;
        }
      }
      return totalAmount;
    } catch (error) {
      throw error;
    }
  },

  floorPriceNFT: async () => {
    let data = await orderModel.findOne({}).sort({ "price": 1 });
    return data;
  },


  findOrders: async (query) => {
    // let query = { nftId: nftId, status: status.ACTIVE }
    return await orderModel.findOne(query).populate([{ path: 'bidId', populate: { path: 'userId' } }, { path: 'nftId' }, { path: 'nftId', populate: { path: 'currentOwnerId' } }, { path: 'nftId', populate: { path: 'userId' } }, { path: 'currentOwner' }, { path: 'userId' }, { path: 'collectionId' }, { path: 'creatorId' }])
    // ('nftId bidId userId collectionId currentOwner');
  },

  findOrders1: async (query) => {
    // let query = { collectionId:collectionId,tokenName:tokenName, status: status.ACTIVE }
    return await orderModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "user",
          localField: "userId",
          foreignField: "_id",
          as: "userId"
        }
      },
      {
        $lookup: {
          from: "user",
          localField: "currentOwner",
          foreignField: "_id",
          as: "currentOwner"
        }
      },

      {
        $lookup: {
          from: "nft",
          as: "nftId",
          let: {
            nft_id: "$_id"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$nft_id'] },
                    { $regexMatch: { input: "$nftId.tokenId", regex: tokenId, options: "i" } }
                  ]
                }
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "collection",
          localField: "collectionId",
          foreignField: "_id",
          as: "collectionId"
        }
      },
      {
        $lookup: {
          from: "bid",
          localField: "bidId",
          foreignField: "_id",
          as: "bidId"
        }
      },
      { $sort: { createdAt: -1 } }
    ])
  },


  findOrderswithPaginate: async (query) => {
    // const { search, fromDate, developerId, toDate, page, limit } = validatedBody;

    let result = orderModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "nft",
          localField: "_id",
          foreignField: "nftId",
          as: "nftDetails"
        }
      },
      {
        $lookup: {
          from: "bid",
          localField: "_id",
          foreignField: "bidId",
          as: "bidDetails"
        }
      },
      {
        $lookup: {
          from: "user",
          localField: "_id",
          foreignField: "userId",
          as: "userDetails"
        }
      },
      { $sort: { createdAt: -1 } }
    ])
    return await orderModel.paginate(result, {
      // page: page || 1,
      // limit: limit || 10
    });
  },



}

module.exports = { orderServices };
