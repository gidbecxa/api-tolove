// Imports
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');
const authCtrl = require('../../Controllers/auth.controllers');
const refreshTokenCtrl = require('../../Controllers/refreshToken.controller')

//import validator
const { registerSchema, loginSchema, verifySchema, loginAdminSchema, agentUserSchema } = require('../../Utils/validationShema');
const { upload } = require('../../multerConfig');

module.exports = (apiRouter) => {

    apiRouter.route('/auth/register/').post(ValidatorMiddlewares(registerSchema), authCtrl.register); // à changer plus tard à registerWithTwilio
    apiRouter.route('/auth/register/').post(ValidatorMiddlewares(registerSchema), authCtrl.sendSigninCode); // à mettre à plus tard pour utiliser Twilio
    apiRouter.route('/auth/add-user/:agentId').post(upload.single('image'), authCtrl.createUserByAgent);
    apiRouter.route('/auth/add-agent/:agentId').post(authCtrl.createAgent);
    apiRouter.route('/auth/verify/').post(ValidatorMiddlewares(verifySchema), authCtrl.verify); // à changer plus tard à verifyViaTwilio
    apiRouter.route('/auth/verify/company/').post(ValidatorMiddlewares(verifySchema), authCtrl.verifyCompanyNoTwilio); // à changer plus tard à verifyCompany
    apiRouter.route('/auth/login/').post(ValidatorMiddlewares(loginSchema), authCtrl.loginDemo);
    apiRouter.route('/auth/login-admin/').post(ValidatorMiddlewares(loginAdminSchema), authCtrl.loginAdmin);
    apiRouter.route('/auth/refresh_endpoint').post(refreshTokenCtrl.refreshToken);
};
