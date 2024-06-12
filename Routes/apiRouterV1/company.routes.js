// Imports
const companyCtrl = require('../../Controllers/company.controllers')
const usersCtrl = require('../../Controllers/users.controllers')
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
    apiRouter.route('/company/me').get(companyMiddleware, companyCtrl.getMe);
    apiRouter.route('/company/getOne/:id').get(companyCtrl.getOne);
    apiRouter.route('/company/get-profile-photo/:id').get(companyMiddleware, companyCtrl.getProfilePhoto);
    apiRouter.route('/company/getLogo/:id').get(companyCtrl.getLogo);
    apiRouter.route('/company/annonces/total-likes').get(companyMiddleware, companyCtrl.countTotalLikesForCompany);

    // put routes
    apiRouter.route('/company/update/logo-description/').put(companyMiddleware, upload.single('image'), companyCtrl.updateProfilLastData);
    apiRouter.route('/company/update/profile').put(ValidatorMiddlewares(updateCompanySchema), companyMiddleware, companyCtrl.updateProfile);

    apiRouter.route('/company/update/first-step/').put(ValidatorMiddlewares(updateCompanySchema), companyMiddleware, companyCtrl.updateFirstProfileData);
    apiRouter.route('/company/update/coins/:id').put(companyMiddleware, companyCtrl.updateSolde);

    // post routes
    apiRouter.route('/company/subscribe/').post(ValidatorMiddlewares(companySubscriptionSchema), companyMiddleware, companyCtrl.subscribeCompany);
    apiRouter.route('/company/unSubscribe/').post(companyMiddleware, companyCtrl.unSubscribeCompany);
    apiRouter.route('/company/logo/presigned-url').post(companyCtrl.getLogoWithUrl);
};