//v7 imports
import user from "./api/v1/controllers/user/routes";
import staticContent from "./api/v1/controllers/static/routes";
import admin from './api/v1/controllers/admin/routes'; 
import order from './api/v1/controllers/book/routes';   



/**
 *
 *
 * @export
 * @param {any} app
 */

export default function routes(app) {

  app.use("/api/v1/user", user);
  app.use('/api/v1/static', staticContent);
  app.use('/api/v1/admin', admin); 
  app.use('/api/v1/order', order);  





  return app;
}
