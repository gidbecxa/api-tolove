// Imports
const {ValidatorMiddlewares} = require('../../Middlewares/validator.middlewares');
const authCtrl = require('../../Controllers/auth.controllers');
const refreshTokenCtrl = require('../../Controllers/refreshToken.controller')

//import validator
const {registerSchema, loginSchema, verifySchema} = require('../../Utils/validationShema')

module.exports = (apiRouter) => {

    apiRouter.route('/auth/register/').post(ValidatorMiddlewares(registerSchema), authCtrl.register);
    apiRouter.route('/auth/verify/').post(ValidatorMiddlewares(verifySchema), authCtrl.verify);
    apiRouter.route('/auth/login/').post(ValidatorMiddlewares(loginSchema), authCtrl.login);
    apiRouter.route('/auth/refresh_endpoint').post(refreshTokenCtrl.refreshToken);
};