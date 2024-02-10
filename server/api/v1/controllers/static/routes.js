import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth"; 


export default Express.Router()

    .post('/addStaticContent', controller.addStaticContent)
    .get('/viewStaticContent', controller.viewStaticContent)
    .put('/editStaticContent', controller.editStaticContent) 
 
