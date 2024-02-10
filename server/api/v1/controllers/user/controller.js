import Joi from "joi";
import _, { isNull } from "lodash";
import config from "config";
import bcrypt from 'bcryptjs';

import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response'; 
import Secret from 'speakeasy';
import qr from 'qrcode';

import responseMessage from '../../../../../assets/responseMessage';
import { userServices } from '../../services/user'; 
import { orderServices } from '../../services/order'; 
import { historyServices } from '../../services/history';   
const { userCheck, userCount, checkUserExists, findCountTopSaler, emailMobileExist, createUser, findUser, findLinkInstgram, findfollowers, findfollowing, userDetailsWithNft, updateUser, updateUserById, paginateSearch, userAllDetails, topSaler, topBuyer, findAdminUser, paginateTopinfluencerList, updateManyUser, listUser } = userServices;
const { paginateUserOnSaleOrder, findOrder, paginateUserOwendOrder, userBuyList, userBuyAndCreatedList, paginateSoldOrder, findOrderLike, findOrders1, findOrderFavourate, listOrder, paginateUserOrder, orderList, findOrders, findTopSeller } = orderServices; 
 
const { createHistory, findHistory, updateHistory, historyList, paginateShowNftHistory, paginateUserOwendHistory, paginateHistory } = historyServices;
  
 

import { notificationServices } from '../../services/buyNotification';
const { createNotification, findNotification, updateNotification, multiUpdateNotification, notificationList, notificationListWithSort } = notificationServices;
 
import commonFunction from '../../../../helper/util';
import jwt from 'jsonwebtoken';
import status from '../../../../enums/status';
import userType from "../../../../enums/userType"; 



export class userController {




  /**
   * @swagger
   * /user/signup:
   *   post:
   *     tags:
   *       - USER
   *     description: signup
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: signup
   *         description: signup
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/signup'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async signUp(req, res, next) {
    const validationSchema = {
      email: Joi.string(),
      password: Joi.string().allow("").optional(),
      confirmPassword: Joi.string().allow("").optional(),
      mobileNumber:Joi.string(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      userName: Joi.string().optional(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }

      const validatedBody = await Joi.validate(req.body, validationSchema);
      const { password, confirmPassword, email } = validatedBody;

      var userInfo = await checkUserExists(email);
      if (userInfo) {
        if (userInfo.otpVerified == true) {
          if (userInfo.email == email) {
            if (userInfo.status === status.BLOCK) {
              throw apiError.conflict(
                responseMessage.BLOCK_USER_EMAIL_BY_ADMIN
              );
            } else {
              throw apiError.conflict(responseMessage.EMAIL_EXIST);
            }
          }
        }
      }
      if (
        (validatedBody.password || validatedBody.confirmPassword) &&
        validatedBody.password !== validatedBody.confirmPassword
      ) {
        throw apiError.badRequest(responseMessage.PASSWORD);
      }

      validatedBody.password = bcrypt.hashSync(validatedBody.password);
      validatedBody.otp = commonFunction.getOTP();
      validatedBody.otpExpireTime = new Date().getTime() + 300000;
      validatedBody.userType = userType.USER;
      if (email) {
        let data = await commonFunction.sendEmailOtp(email, validatedBody.otp);
        console.log("data====>>>", data);
      }

      if (userInfo) {
        var result = await updateUser({ _id: userInfo._id }, validatedBody);
        return res.json(new response(result, responseMessage.USER_CREATED));
      }
      var result = await createUser(validatedBody);
      result = _.omit(JSON.parse(JSON.stringify(result)), "otp");
      return res.json(new response(result, responseMessage.USER_CREATED));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

 /**
   * @swagger
   * /user/resendOTP:
   *   post:
   *     tags:
   *       - USER
   *     description: Resend OTP (One Time Password)
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: body
   *         in: body
   *         description: User's email or mobile number to resend OTP
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             email:
   *               type: string
   *               description: Email or mobile number to resend OTP
   *     responses:
   *       200:
   *         description: Returns success message after resending OTP
   */

 async resendOTP(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email } = validatedBody;
      var userResult = await findUser({
        email: email,
        status: { $ne: status.DELETE },
        userType: userType.USER,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      var otp = commonFunction.getOTP();
      var otpTime = new Date().getTime() + 180000;
      await commonFunction.sendMailOtpForgetAndResend(email, otp);
      var updateResult = await updateUser(
        { _id: userResult._id },
        { otp: otp, otpTime: otpTime }
      );
      return res.json(new response({}, responseMessage.OTP_SEND));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }

  /**
   * @swagger
   * /user/forgotPassword:
   *   post:
   *     tags:
   *       - USER
   *     description: forgotPassword
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: email
   *         description: email
   *         in: formData
   *         required: true
   *     responses:
   *       200:
   *         description: Returns success message
   */

  async forgotPassword(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email } = validatedBody;
      var userResult = await findUser({
        email: email,
        status: { $ne: status.DELETE },
        userType: userType.USER,
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      } else {
        var otp = commonFunction.getOTP();
        var newOtp = otp;
        var time = Date.now() + 180000;
        await commonFunction.sendMailOtpForgetAndResend(email, otp);
        var updateResult = await updateUser(
          { _id: userResult._id },
          { $set: { otp: newOtp, otpTime: time } }
        );
        return res.json(new response({}, responseMessage.OTP_SEND));
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
 
 
  /**
   * @swagger
   * /user/login:
   *   post:
   *     tags:
   *       - USER
   *     description: login with email and password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: login
   *         description: login
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/login'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async login(req, res, next) {
    var validationSchema = {
      email: Joi.string().required(),
      password: Joi.string().required(),
    };
    try {
      if (req.body.email) {
        req.body.email = req.body.email.toLowerCase();
      }
      var results;
      var validatedBody = await Joi.validate(req.body, validationSchema);
      const { email, password } = validatedBody;
      let userResult = await findUser({
        email: email,
        status: { $ne: status.DELETE },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (userResult.otpVerified === false) {
        throw apiError.badRequest(responseMessage.OTP_NOT_VERIFY);
      }
      if (!bcrypt.compareSync(password, userResult.password)) {
        throw apiError.conflict(responseMessage.INCORRECT_LOGIN);
      } else {
        var token = await commonFunction.getToken({
          _id: userResult._id,
          email: userResult.email,
          mobileNumber: userResult.mobileNumber,
          userType: userResult.userType,
        });
        results = {
          _id: userResult._id,
          email: email,
          userType: userResult.userType,
          token: token,
        };
      }
      return res.json(new response(results, responseMessage.LOGIN));
    } catch (error) {
      console.log(error);
      return next(error);
    }
  }
  /**
   * @swagger
   * /user/editProfile:
   *   put:
   *     tags:
   *       - USER
   *     description: editProfile with all basic details he Want to update in future
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: email
   *         description: email
   *         in: formData
   *         required: false
   *       - name: firstName
   *         description: firstName
   *         in: formData
   *         required: false
   *       - name: lastName
   *         description: lastName
   *         in: formData
   *         required: false
   *       - name: userName
   *         description: userName
   *         in: formData
   *         required: false 
   *       - name: mobileNumber
   *         description: mobileNumber
   *         in: formData
   *         required: false
   *       - name: profilePic
   *         description: profilePic
   *         in: formData
   *         required: false 
   *       - name: address
   *         description: address
   *         in: formData
   *         required: false
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async editProfile(req, res, next) {     
      const validationSchema = {
        email: Joi.string().allow("").optional(),
        firstName: Joi.string().allow("").optional(),
        lastName: Joi.string().allow("").optional(),
        userName: Joi.string().allow("").optional(),
        address: Joi.string().allow("").optional(),
        mobileNumber: Joi.string().allow("").optional(),
        profilePic: Joi.string().allow("").optional(),
      };
      try {
        console.log("gdgdjgdjdg");
        if (req.body.email) {
          req.body.email = req.body.email.toLowerCase();
        }
        let validatedBody = await Joi.validate(req.body, validationSchema);
  
        let userResult = await findUser({
          _id: req.userId,
          status: { $ne: status.DELETE },
          userType: userType.USER,
        });
        if (!userResult) {
          throw apiError.notFound(responseMessage.USER_NOT_FOUND);
        }
        validatedBody.isUpdateProfile = true;
        if (validatedBody.profilePic) {
          validatedBody.profilePic = validatedBody.profilePic;
           
        }
  
        await updateUser({ _id: userResult._id }, validatedBody);
        return res.json(new response({}, responseMessage.PROFILE_UPDATED));
      } catch (error) {
        console.log("error", error);
        return next(error);
      }
    }
  /**
   * @swagger
   * /user/changePassword:
   *   patch:
   *     tags:
   *       - USER
   *     description: Change user password
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: User authentication token
   *         in: header
   *         required: true
   *       - name: body
   *         in: body
   *         description: User's old and new passwords
   *         required: true
   *         schema:
   *           type: object
   *           properties:
   *             oldPassword:
   *               type: string
   *               description: Current password of the user
   *             newPassword:
   *               type: string
   *               description: New password to be set for the user
   *     responses:
   *       200:
   *         description: Returns success message after changing the password
   */
  async changePassword(req, res, next) {
    const validationSchema = {
      oldPassword: Joi.string().required(),
      newPassword: Joi.string().required(),
    };
    try {
      let validatedBody = await Joi.validate(req.body, validationSchema);
      let userResult = await findUser({ _id: req.userId });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      if (!bcrypt.compareSync(validatedBody.oldPassword, userResult.password)) {
        throw apiError.badRequest(responseMessage.PWD_NOT_MATCH);
      }
      let updated = await updateUserById(userResult._id, {
        password: bcrypt.hashSync(validatedBody.newPassword),
      });
      return res.json(new response({}, responseMessage.PWD_CHANGED));
    } catch (error) {
      return next(error);
    }
  }
  /**
   * @swagger
   * /admin/deleteUserAccount:
   *   delete:
   *     tags:
   *       - ADMIN_USER_MANAGEMENT
   *     description: deleteSubAdmin When Admin want to delete Any USER from plateform
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: token
   *         description: token
   *         in: header
   *         required: true
   *       - name: _id
   *         description: _id
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#/definitions/deleteUserAccount'
   *     responses:
   *       200:
   *         description: Returns success message
   */
  async deleteUserAccount(req, res, next) {
    try {
      var userResult = await findUser({
        _id: req.userId,
        status: { $ne: status.DELETE },
      });
      if (!userResult) {
        throw apiError.notFound(responseMessage.USER_NOT_FOUND);
      }
      let deleteRes = await updateUser(
        { _id: userResult._id },
        { status: status.DELETE }
      );
      return res.json(new response(deleteRes, responseMessage.DELETE_SUCCESS));
    } catch (error) {
      return next(error);
    }
  }
 
 

 
  

 

    /**
     * @swagger
     * /user/userList:
     *   get:
     *     tags:
     *       - USER
     *     description: userList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: status
     *         description: status
     *         in: query
     *       - name: search
     *         description: search
     *         in: query
     *         required: false
     *       - name: fromDate
     *         description: fromDate
     *         in: query
     *         required: false
     *       - name: toDate
     *         description: toDate
     *         in: query
     *         required: false
     *       - name: page
     *         description: page
     *         in: query
     *         type: integer
     *         required: false
     *       - name: limit
     *         description: limit
     *         in: query
     *         type: integer
     *         required: false
     *     responses:
     *       200:
     *         description: Data found successfully.
     *       404:
     *         description: Data not found.
     */

    async userList(req, res, next) {
        const validationSchema = {
            status: Joi.string().optional(),
            search: Joi.string().optional(),
            fromDate: Joi.string().optional(),
            toDate: Joi.string().optional(),
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            let dataResults = await paginateSearch(validatedBody);
            if (dataResults.length == 0) {
                throw apiError.notFound([], responseMessage.DATA_NOT_FOUND)
            }
            return res.json(new response(dataResults, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }
 
 
 

    /**
     * @swagger
     * /user/userBuyList/{_id}:
     *   get:
     *     tags:
     *       - USER
     *     description: userBuyList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: _id
     *         description: _id for userId
     *         in: path
     *         required: true
     *     responses:
     *       200:
     *         description: Data found successfully.
     *       404:
     *         description: User not found.
     */

    async userBuyList(req, res, next) {
        try {
            let userResult = await findUser({ _id: req.params._id });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            } else {
                let createdInfo = await userBuyList(userResult._id)
                if (createdInfo.length == 0) {
                    return res.json(new response([], responseMessage.DATA_NOT_FOUND));
                } else {
                    return res.json(new response(createdInfo, responseMessage.DATA_FOUND));
                }
            }
        } catch (error) {
            return next(error);
        }
    }  

/**
* @swagger
* /user/sendOtpOnEmail:
*   put:
*     tags:
*       - USER
*     description: sendOtpOnEmail
*     produces:
*       - application/json
*     parameters:
*       - name: token
*         description: token
*         in: header
*         required: true 
*       - name: email
*         description: email
*         in: query
*         required: false     
*     responses:
*       200:
*         description: Otp send on your email.
*       501:
*         description: Something went wrong.
*       404:
*         description: Data not found.
*/

    async sendOtpOnEmail(req, res, next) {
        try {
            const validationSchema = Joi.object({
                email: Joi.string().optional(),
            });
            const validatedBody = await Joi.validate(req.query, validationSchema);
            const userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }
            const email = validatedBody.email || userResult.email;
            const otp = commonFunction.getOTP();
            const otpTime = new Date().getTime() + 180000;
            await commonFunction.sendOTP(email, otp);
            const updateResult = await updateUser({ _id: userResult._id }, { $set: { otp, otpTime } });
            return res.json(new response(updateResult, responseMessage.OTP_SEND));
        } catch (error) {
            console.error(error);
            return next(error);
        }
    }

    /**
    * @swagger
    * /user/verifyOTP:
    *   post:
    *     tags:
    *       - USER
    *     description: verifyOTP
    *     produces:
    *       - application/json
    *     parameters:
    *       - name: token
    *         description: token
    *         in: header
    *         required: true
    *       - name: otp
    *         description: otp
    *         in: formData
    *         required: true
    *     responses:
    *       200:
    *         description: Returns success message
    */
    async verifyOTP(req, res, next) {
        var validationSchema = Joi.object({
            otp: Joi.number().required(),
        });

        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);

            var userResult = await findUser({
                _id: req.userId,
                userType: userType.USER,
                status: { $ne: status.DELETE },
            });
            if (!userResult) {
                throw apiError.notFound(responseMessage.USER_NOT_FOUND);
            }

            if (new Date().getTime() > userResult.otpTime) {
                throw apiError.badRequest(responseMessage.OTP_EXPIRED);
            }

            if (userResult.otp !== validatedBody.otp) {
                throw apiError.badRequest(responseMessage.INCORRECT_OTP);
            }

            var updateResult = await updateUser({ _id: userResult._id }, { otpVerification: true });

            return res.json(new response(updateResult, responseMessage.OTP_VERIFY));
        } catch (error) {
            console.log("error: ", error);
            return next(error);
        }
    }




         /**
     * @swagger
     * /user/getProfile:
     *   get:
     *     tags:
     *       - USER
     *     description: get his own profile details with getProfile API
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: token
     *         description: token
     *         in: header
     *         required: true
     *       - name: ipAddress
     *         description: ipAddress
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Returns success message
     */
         async getProfile(req, res, next) {
            try {
                let userResult = await findUser({ _id: req.userId, status: { $ne: status.DELETE } });
                if (!userResult) {
                    throw apiError.notFound(responseMessage.USER_NOT_FOUND);
                }
                await updateUser({ _id: userResult._id }, { ipAddress: req.query.ipAddress })
                return res.json(new response(userResult, responseMessage.USER_DETAILS));
            } catch (error) {
                return next(error);
            }
        }
    
      /**
       * @swagger
       * /user/resetPassword:
       *   post:
       *     tags:
       *       - USER
       *     description: Reset password by USER on plateform
       *     produces:
       *       - application/json
       *     parameters:
       *       - name: token
       *         description: token
       *         in: header
       *         required: true
       *       - name: password
       *         description: password
       *         in: formData
       *         required: true
       *       - name: confirmPassword
       *         description: confirmPassword
       *         in: formData
       *         required: true
       *     responses:
       *       200:
       *         description: Your password has been successfully changed.
       *       404:
       *         description: This user does not exist.
       *       422:
       *         description: Password not matched.
       *       500:
       *         description: Internal Server Error
       *       501:
       *         description: Something went wrong!
       */
      async resetPassword(req, res, next) {
        const validationSchema = {
          password: Joi.string().required(),
          confirmPassword: Joi.string().required(),
        };
        try {
          const { password, confirmPassword } = await Joi.validate(
            req.body,
            validationSchema
          );
          var userResult = await findUser({
            _id: req.userId,
            status: { $ne: status.DELETE },
          });
    
          if (!userResult) {
            throw apiError.notFound(responseMessage.USER_NOT_FOUND);
          } else {
            if (password == confirmPassword) {
              await updateUser(
                { _id: userResult._id },
                { passcode: bcrypt.hashSync(password ) }
              );
    
              await commonFunction.sendConfirmationMail(userResult.email);
              return res.json(new response({}, responseMessage.PWD_CHANGED));
            } else {
              throw apiError.notFound(responseMessage.PWD_NOT_MATCH);
            }
          }
        } catch (error) {
          console.log(error);
          return next(error);
        }
      }
    
    }
    
 
 



export default new userController()

function getDateFilters(type) {
    const dateFilters = {
        Daily: {
            createdAt: {
                $gte: new Date(),
                $lt: new Date((new Date()).getTime() + 24 * 60 * 60 * 1000),
            },
        },
        Weekly: {
            createdAt: {
                $gte: new Date((new Date()).setDate((new Date()).getDate() - 7)),
                $lt: new Date()
            },
        },
        Monthly: {
            createdAt: {
                $gte: new Date((new Date()).getFullYear(), (new Date()).getMonth() - 1, (new Date()).getDate()),
                $lt: new Date(),
            },
        },
    };




    

    return type ? dateFilters[type] : {};
}
