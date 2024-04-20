// Imports
const companyCtrl = require('../../Controllers/company.controllers')
const { authMiddleware, companyMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');
const refreshTokenCtrl = require('../../Controllers/refreshToken.controller')
const { companyRegisterSchema, companyVerifySchema, companyLoginSchema, companySubscriptionSchema, updateCompanySchema, } = require('../../Utils/validationShema');

const { upload } = require('../../multerConfig');

module.exports = (apiRouter) => {

    // company auth routes
    apiRouter.route('/company/auth/register/').post(ValidatorMiddlewares(companyRegisterSchema), companyCtrl.register);
    apiRouter.route('/company/auth/verify/').post(ValidatorMiddlewares(companyVerifySchema), companyCtrl.verify);
    apiRouter.route('/company/auth/login/').post(ValidatorMiddlewares(companyLoginSchema), companyCtrl.login);
    apiRouter.route('/company/auth/refresh_endpoint').post(refreshTokenCtrl.refreshToken);
    
    // get routes
    apiRouter.route('/company/getAll/').get(companyCtrl.getAll);
    apiRouter.route('/company/me').get(companyCtrl.getMe);
    apiRouter.route('/company/getOne/:id').get(companyCtrl.getOne);
    
    apiRouter.route('/company/getLogo/:id').get(companyCtrl.getLogo);
    
    // put routes
    // apiRouter.route('/company/update/profileLogo/:id').put(authMiddleware, upload.single('image'), companyCtrl.updatePicture);
    apiRouter.route('/company/update/upload-logo-description').put(upload.single('image'), companyCtrl.updateProfilNext);
    apiRouter.route('/company/update/profile').put(ValidatorMiddlewares(updateCompanySchema), companyMiddleware, companyCtrl.updateProfile);
    
    // post routes
    apiRouter.route('/company/subscribe/').post(ValidatorMiddlewares(companySubscriptionSchema), companyMiddleware, companyCtrl.subscribeCompany);
    apiRouter.route('/company/unSubscribe/').post( companyMiddleware, companyCtrl.unSubscribeCompany);
    apiRouter.route('/company/logo/presigned-url').post(companyCtrl.getLogoWithUrl);
};