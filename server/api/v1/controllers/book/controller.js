import Joi from "joi";
import _, { update } from "lodash";
import config from "config";
import apiError from "../../../../helper/apiError";
import response from "../../../../../assets/response";
import responseMessage from "../../../../../assets/responseMessage";
import { userServices } from "../../services/user"; 
import { orderServices } from "../../services/order"; 
import { historyServices } from "../../services/history";
import { notificationServices } from "../../services/buyNotification";
import { feedbackServices } from "../../services/feedback"; 
import userType from '../../../../enums/userType';
import orderSchema from '../../../../models/Book'
import paymentSchema from '../../../../models/payment'


 

const { 
  findUser,
  findUserData,
  updateUser, 
} = userServices;
 
 
const {
  createOrder,
  findOrder, 
  findOneOrder,
  updateOrder,
  updateOrderById,
  orderList 
} = orderServices;
 
const {
  createHistory,
  findHistory,
  updateHistory,
  historyList,
  paginateUserOwendHistory,
  paginateHistory,
} = historyServices;
const {
  createNotification,
  findNotiication,
  updateNotification,
  multiUpdateNotification,
  notificationList,
} = notificationServices;
const { createFeedback, findFeedback, updateFeedback, FeedbackList } =
  feedbackServices;
  

import commonFunction from "../../../../helper/util";
import status from "../../../../enums/status";
import fs from "fs";
import ipfsClient from "ipfs-http-client";
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https",
});  
export class bookController {
  /**
   * @swagger
   * /order/createBook:
   *   post:
   *     tags:
   *       - USER createBook
   *     description: createBook
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: createBook
   *         description: createBook
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/createBook'
   *     responses:
   *       200:
   *         description: Your create Book has been  successfully.
   *       404:
   *         description: User not found 
   *       500:
   *         description: Internal server error. 
   */

  async createBook(req, res, next) {
    const validationSchema = {
      title: Joi.string().optional(),
      price: Joi.string().optional(),
      description: Joi.string().optional(),
    };
    try {
      const validatedBody = await Joi.validate(req.body, validationSchema);
      console.log("validatedBody==========>>>>>", validatedBody);
      let userResult = await findUserData(
        { _id: req.userId },
        { $ne: userType.USER }
      );
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (validatedBody.price < 100 || validatedBody.price > 1000) {
        throw apiError.notFound(
          ` Invalid price for product . Price must be between $100 and $1000`
        );
      }

      validatedBody.userId = userResult._id;
      validatedBody.isCreated = true;
      if (validatedBody.bookId)
        await updateOrder({ _id: validatedBody.bookId }, { isDeleted: true });
      var result = await createOrder(validatedBody);

      await updateUser(
        { _id: userResult._id },
        { $inc: { orderCount: 1, topSaler: 1 } }
      );
 
      let obj = {
        userId: userResult._id,
        title: "NEW BOOK",
        description: "You have Created  one book successfully.",
        notificationType: "New_ORDER",
        date: commonFunction.dateTime(),
      };
      await createNotification(obj);
      let historyRes = {
        userId: userResult._id,
        type: "BOOK_CREATE",
        title: "Create a new book ",
        description: "A new book has been created successfully.",
      };
      let history = await createHistory(historyRes);
      console.log("====>", history);
      return res.json(new response(result, responseMessage.CREATE_BOOK));
    } catch (error) {
      console.log("error====>", error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /order/editOrder:
   *   put:
   *     tags:
   *       - USER ORDER
   *     description: editOrder
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: editOrder
   *         description: editOrder
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/editBook'
   *     responses:
   *       200:
   *         description: Your Book has been successfully updated..
   *       404:
   *         description: User not found/Data not found.
   *       500:
   *         description: Internal server error 
   */
  async editBook(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(), 
      title: Joi.string().optional(),
      description:Joi.string().optional(), 
      price: Joi.string().optional(), 
      currentOwner: Joi.string().optional(),
      saleType: Joi.string().optional(), 
    };
    try {
      var validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var orderResult = await findOrder({
        _id: validatedBody._id,
        status: { $ne: status.DELETE },
      });
      if (!orderResult) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      let updateObj = {};
      if (validatedBody.collectionId)
        updateObj.collectionId = validatedBody.collectionId;
      if (validatedBody.isResale) updateObj.isResale = validatedBody.isResale; 
      var result = await updateOrderById({ _id: orderResult._id }, validatedBody);
      return res.json(new response(result, responseMessage.BOOK_UPDATED));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /order/deleteOrder:
   *   delete:
   *     tags:
   *       - USER ORDER
   *     description: deleteOrder
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: query
   *         required: true
   *     responses:
   *       200:
   *         description: BOOK delete successfully.
   *       404:
   *         description: User not found/Data not found.
   *       500:
   *         description: Internal server error.
   *       409:
   *         description: Already Exist.
   */

  async deleteOrder(req, res, next) {
    const validationSchema = {
      _id: Joi.string().required(),
    };
    try {
      const { _id } = await Joi.validate(req.query, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var orderResult = await findOrder({
        _id: _id,
        status: { $ne: status.DELETE },
      });
      if (!orderResult) {
        throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
      }
      var result = await updateOrder(
        { _id: orderResult._id },
        { status: status.DELETE }
      );
      return res.json(new response(result, responseMessage.BOOK_DELETE));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /order/buyBook:
   *   post:
   *     tags:
   *       - USER buyBook
   *     description: buyBook
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token is required.
   *         in: header
   *         required: true
   *       - in: body
   *         name: buyBook
   *         description: buyBook.
   *         schema:
   *           type: object
   *           required:
   *             - bookId
   *           properties:
   *             bookId:
   *               type: string
   *             description:
   *               type: string
   *             quantity:
   *               type: string
   *     responses:
   *       200:
   *         description: Congrats!! You successfully buy this BOOK
   *       404:
   *         description: User not found 
   *       500:
   *         description: Internal server error.
   *       409:
   *         description: Already Exist.
   */

  async buyBook(req, res, next) {
    let validationSchema = {
      bookId: Joi.string().required(),
      quantity: Joi.string().optional(),
      description: Joi.string().optional(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound([], responseMessage.USER_NOT_FOUND);
      }
      let orderRes = await findOrder({
        _id: validatedBody.bookId,
        isCreated: true,
        saleType: "ONSALE",
        status: { $ne: status.DELETE },
      });
      if (!orderRes) {
        return res.json(new response([], responseMessage.DATA_NOT_FOUND));
      } else {
        validatedBody.userId = userResult._id; 
        validatedBody.price = orderRes.price;
        validatedBody.sellerId = orderRes.userId;
        validatedBody.saleType = "OFFSALE";
        validatedBody.isCreated = false;
        validatedBody.creatorId = orderRes.creatorId; // new line 17 oct
        validatedBody.sellCount =
          orderRes.sellCount === undefined ? 0 : orderRes.sellCount + 1;
        var buyResult = await createOrder(validatedBody);

        delete validatedBody.sellerId;
        delete validatedBody.userId;
        delete validatedBody.isCreated;
        validatedBody.buyerId = userResult._id;
        validatedBody.sellStatus = "SOLD";
        validatedBody.saleType = "OFFSALE";
        validatedBody.isDeleted = true;
        await updateOrder({ _id: orderRes._id }, validatedBody);
 
        let activityResult = {
          userId: userResult._id,
          bookId: orderRes._id,
          type: "BOOK_SELL",
        };
        let notificationResUser = {
          userId: userResult._id,
          title: "NEW BOOK SELL",
          description: "You have successfully buy a new book.",
          notificationType: "BOOK SELL",
          date: commonFunction.dateTime(),
        };
        await createNotification(notificationResUser);
        let notificationResOwner = {
          userId: orderRes.userId,
          title: "NEW BOOK SELL",
          description: `Your book is Successfully buy.`,
          notificationType: "BOOK SELL",
          date: commonFunction.dateTime(),
        };
        await createNotification(notificationResOwner); 
      }
      return res.json(new response(buyResult, responseMessage.BUY_SUCCESS));
    } catch (error) {
      throw error;
    }
  }
  /**
   * @swagger
   * /order/feedBack:
   *   post:
   *     tags:
   *       - USER FEEDBACK
   *     description: feedBack
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: bookId
   *         description: bookId
   *         in: formData
   *         required: false
   *       - name: rating
   *         description: rating
   *         in: formData
   *         required: true
   *       - name: comment
   *         description: comment
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async feedBack(req, res, next) {
    try {
      let userCheck = await findUser({ _id: req.userId });
      if (!userCheck) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let orderCheck, feedbackcheck, update, saveResult;
      let obj = {
        userId: userCheck._id,
        rating: req.body.rating,
        comment: req.body.comment,
      };
      if (req.body.bookId) {
        orderCheck = await findOrder({ _id: req.body.bookId });
        obj["bookId"] = orderCheck._id;
        feedbackcheck = await findFeedback({
          userId: userCheck._id,
          bookId: orderCheck._id,
        });
        if (feedbackcheck) {
          update = await updateFeedback({ _id: feedbackcheck._id }, obj);
          return res.json(new response(update, responseMessage.DATA_FOUND));
        } else {
          saveResult = await createFeedback(obj);
          return res.json(new response(saveResult, responseMessage.DATA_FOUND));
        }
      }
      feedbackcheck = await findFeedback({ userId: userCheck._id });
      if (feedbackcheck) {
        update = await updateFeedback({ _id: feedbackcheck._id }, obj);
        return res.json(new response(update, responseMessage.DATA_FOUND));
      } else {
        saveResult = await createFeedback(obj);
        return res.json(new response(saveResult, responseMessage.DATA_FOUND));
      }
    } catch (error) {
      return next(error);
    }
  }




    /**
     * @swagger
     * /order/viewBook/{_id}:
     *   get:
     *     tags:
     *       - USER viewBook
     *     description: viewBook
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: _id
     *         description: _id
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Details has been fetched successfully.
     *       404:
     *         description: Data not found.
     *       500:
     *         description: Internal server error. 
     */
    async viewBook(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required()
        };

        try {
            const { _id } = await Joi.validate(req.params, validationSchema);
            let [bookResult, priceData] = await Promise.all([findOneOrder(_id),({   status: status.ACTIVE })])

            if (!bookResult) {
                throw apiError.notFound(responseMessage.DATA_NOT_FOUND);
            }
            if (priceData) {
              bookResult._doc.usdPrice = Number(bookResult.price)  
            }

            // A 


            let finalResult = _.omit(JSON.parse(JSON.stringify(bookResult)),  );
            finalResult.userId = { ...finalResult.userId,  }
            finalResult.currentOwner = { ...finalResult.userId,  }

            return res.json(new response(finalResult, responseMessage.DETAILS_FETCHED));
        } catch (error) {
          console.log("error====>>>",error)
            return next(error);
        }
    }


    /**
     * @swagger
     * /order/payment:
     *   post:
     *     tags:
     *       - PAYMENT
     *     description: payment
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: cardNumber
     *         description: cardNumber
     *         in: formData
     *         required: true
     *       - name: expireMonth
     *         description: expireMonth
     *         in: formData
     *         required: true
     *       - name: expireYear
     *         description: expireYear
     *         in: formData
     *         required: true
     *       - name: cvc
     *         description: cvc
     *         in: formData
     *         required: true
     *       - name: price
     *         description: price
     *         in: formData
     *         required: true
     *       - name: bookId
     *         description: bookId
     *         in: formData
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
    async  payment(req, res, next) {

      const validationSchema = {
        cardNumber: Joi.string().required(),
        expireMonth: Joi.string().required(),
        expireYear: Joi.string().required(),
        cvc: Joi.string().required(),
        price: Joi.string().required(), 
        bookId: Joi.string().required(),
    };
      try {
        const validatedBody = await Joi.validate(req.body, validationSchema);
        const userResult = await findUser({ _id: req.userId })
        if (!userResult) {
            throw apiError.notFound(responseMessage.USER_NOT_FOUND);
        }   ;

        const existingPayment = await paymentSchema.findOne({
          bookId: validatedBody.bookId,
          userId: req.userId,
      });
      if (existingPayment) {
        return res.status(400).json({ message: "Payment for this book already done" });
    }

    if (validatedBody.price < 100 || validatedBody.price > 1000) {
      throw apiError.notFound(
        ` Invalid price for book . Price must be between 100 and 1000`
      );
    }


    const bookDetails = await paymentSchema.findById(validatedBody.bookId);

    if (bookDetails && bookDetails.saletype === "OFFSALE") {
      return res.status(400).json({ message: "Book sale is off, payment not allowed" });
  }const paymentData = {
    userId: req.userId,
    price: validatedBody.price,
    approveStatus: "APPROVE",
    paymentType: "ONLINE",
    ...validatedBody,
};

const newPayment = new paymentSchema(paymentData);
await newPayment.save();

return res.json({
    message: "Payment successful",
    paymentData: paymentData,
});
} catch (error) {
console.log("payment error========>>", error);
return next(error);
}
}

 

}

export default new bookController();
