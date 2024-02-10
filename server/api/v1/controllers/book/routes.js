import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth"; 

export default Express.Router() 

.get('/viewOrder/:_id', controller.viewBook)  
    .use(auth.verifyToken) 
    .put('/editOrder', controller.editBook)
    .delete('/deleteOrder', controller.deleteOrder)
    .post('/buyBook', controller.buyBook)  
    .post('/feedBack',controller.feedBack) 
    .post('/payment',controller.payment)  
    .post('/createBook', controller.createBook)



    