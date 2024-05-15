// Imports
const carteCtrl = require('../../Controllers/carte.controllers');
const { authMiddleware, companyMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');
const {
    addCarteSchema, updateCarteSchema, likeCarteSchema, unLikeCarteSchema, addNewPhotoCarteSchema
} = require('../../Utils/validationShema');
const { upload } = require('../../multerConfig');

module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/carte/company/get-all-annonces').get(companyMiddleware, carteCtrl.getAllAnnoncesByCompany);
    apiRouter.route('/carte/company/get-reservations').get(companyMiddleware, carteCtrl.getCompanyReservations);
    apiRouter.route('/carte/getAll/:category').get(authMiddleware, carteCtrl.getAll);

    // apiRouter.route('/carte/getOne/:id').get(authMiddleware, carteCtrl.getOne);
    // apiRouter.route('/carte/checkCarteLike').get(authMiddleware, carteCtrl.checkCarteLike);
    // apiRouter.route('/carte/getCarteOtherPhotos/:id').get(authMiddleware, carteCtrl.getCarteOtherPhotos);

    // post routes
    apiRouter.route('/annonce/create-annonce').post(companyMiddleware, upload.single('image'), carteCtrl.createAnnonce);
    apiRouter.route('/annonce/photos/presigned-url').post(carteCtrl.getPresignedUrl);

    // apiRouter.route('/carte/searchCarte').post(carteCtrl.searchCarte);
    // apiRouter.route('/carte/addCarte').post(ValidatorMiddlewares(addCarteSchema), authMiddleware, carteCtrl.addCarte);
    // apiRouter.route('/carte/deleteCarte/:id').post(authMiddleware, carteCtrl.deleteCarte);
    // apiRouter.route('/carte/likeCarte').post(ValidatorMiddlewares(likeCarteSchema), authMiddleware, carteCtrl.likeCarte);
    // apiRouter.route('/carte/unLikeCarte').post(ValidatorMiddlewares(unLikeCarteSchema), authMiddleware, carteCtrl.unLikeCarte);
    // apiRouter.route('/carte/makeReservation').post(authMiddleware, carteCtrl.makeReservation);
    // apiRouter.route('/carte/skipReservation').post(authMiddleware, carteCtrl.skipReservation);
    // apiRouter.route('/carte/addNewPhotoCarte').post(ValidatorMiddlewares(addNewPhotoCarteSchema), authMiddleware, carteCtrl.addNewPhotoCarte);

    // put routes
    // apiRouter.route('/carte/updateCarte/:id').put(ValidatorMiddlewares(updateCarteSchema), authMiddleware, carteCtrl.updateCarte);
};