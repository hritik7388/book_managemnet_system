import Joi from "joi";
import _ from "lodash";
import apiError from '../../../../helper/apiError';
import response from '../../../../../assets/response';
import responseMessage from '../../../../../assets/responseMessage';
import commonFunction from '../../../../helper/util';
import { staticServices } from '../../services/static'; 
import { userServices } from '../../services/user';
 

const { createStaticContent, findStaticContent, updateStaticContent, staticContentList } = staticServices; 
 
const { userCheck, findUser, findUserData, createUser, updateUser, updateUserById, userSubscriberList } = userServices;

import status from '../../../../enums/status';


export class staticController {

    /**
     * @swagger
     * /static/addStaticContent:
     *   post:
     *     tags:
     *       - STATIC
     *     description: addStaticContent
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: addStaticContent
     *         description: addStaticContent
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/addStaticContent'
     *     responses:
     *       200:
     *         description: Static content added successfully.
     *       501:
     *         description: Something went wrong.
     *       404:
     *         description: User not found.
     *       409:
     *         description: Already exist.
     */
    async addStaticContent(req, res, next) {
        const validationSchema = {
            type: Joi.string().valid('termsConditions', 'privacyPolicy', 'aboutUs').required(),
            title: Joi.string().required(),
            description: Joi.string().required(),
        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            const { type, title, description } = validatedBody;
            let check = await findStaticContent({ type: type, status: status.ACTIVE })
            if (check) {
                throw apiError.alreadyExist(responseMessage.ALREADY_EXIST)
            }
            var result = await createStaticContent({ type: type, title: title, description: description })
            return res.json(new response(result, responseMessage.CMS_SAVED));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /static/viewStaticContent:
     *   get:
     *     tags:
     *       - STATIC
     *     description: viewStaticContent
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: type
     *         description: type
     *         in: query
     *         required: true
     *     responses:
     *       200:
     *         description: Static data found successfully.
     *       501:
     *         description: Something went wrong.
     *       404:
     *         description: User not found.
     *       409:
     *         description: Already exist.
     */

    async viewStaticContent(req, res, next) {
        const validationSchema = {
            type: Joi.string().valid('termsConditions', 'privacyPolicy', 'aboutUs').required(),
        };
        try {
            const validatedBody = await Joi.validate(req.query, validationSchema);
            var result = await findStaticContent({ type: validatedBody.type })
            return res.json(new response(result, responseMessage.DATA_FOUND));
        } catch (error) {
            return next(error);
        }
    }

    /**
     * @swagger
     * /static/editStaticContent:
     *   put:
     *     tags:
     *       - STATIC
     *     description: editStaticContent
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: editStaticContent
     *         description: editStaticContent
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/editStaticContent'
     *     responses:
     *       200:
     *         description: Successfully updated.
     *       501:
     *         description: Something went wrong.
     *       404:
     *         description: Data not found.
     *       409:
     *         description: Already exist.
     */
    async editStaticContent(req, res, next) {
        const validationSchema = {
            _id: Joi.string().required(),
            title: Joi.string().optional(),
            description: Joi.string().optional(),

        };
        try {
            const validatedBody = await Joi.validate(req.body, validationSchema);
            var statisRes = await findStaticContent({ _id: validatedBody._id })
            if (!statisRes) {
                throw apiError.notFound([], responseMessage.DATA_NOT_FOUND)
            }
            var result = await updateStaticContent({ _id: statisRes._id }, validatedBody)
            return res.json(new response(result, responseMessage.UPDATE_SUCCESS));
        } catch (error) {
            return next(error);
        }
    }
 
}

export default new staticController()
