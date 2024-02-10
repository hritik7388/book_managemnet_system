import Express from "express";
import controller from "./controller";
import auth from "../../../../helper/auth"; 


export default Express.Router() 
 //done
    .get('/userBuyList/:_id', controller.userBuyList)  
    .get('/userList', controller.userList)   




    .post("/signUp", controller.signUp) 
    .post("/resendOTP", controller.resendOTP)
    .post("/forgotPassword", controller.forgotPassword)
  
    .post("/login", controller.login) 
  
    .use(auth.verifyToken)
    .post('/verifyOTP', controller.verifyOTP) 
    .delete("/deleteUserAccount", controller.deleteUserAccount) 
    .post("/resetPassword", controller.resetPassword)
    .patch("/changePassword", controller.changePassword)
  
     
  
    .put("/editProfile", controller.editProfile);
    

 



 
