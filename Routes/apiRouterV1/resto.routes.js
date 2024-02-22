// Imports
const restoCtrl = require('../../Controllers/resto.controllers');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');
const {
    addRestoSchema, updateRestoSchema, deleteRestoSchema, likeRestoSchema, unLikeRestoSchema
} = require('../../Utils/validationShema');

module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/resto/getAll/').get(authMiddleware, restoCtrl.getAll);
    apiRouter.route('/resto/getOne/:id').get(authMiddleware, restoCtrl.getOne);
    apiRouter.route('/resto/checkRestoLike').get(authMiddleware, restoCtrl.checkRestoLike);

    // post routes
    apiRouter.route('/resto/searchResto').post(restoCtrl.searchResto);
    apiRouter.route('/resto/addResto').post(ValidatorMiddlewares(addRestoSchema), authMiddleware, restoCtrl.addResto);
    apiRouter.route('/resto/deleteResto/:id').post(ValidatorMiddlewares(deleteRestoSchema), authMiddleware, restoCtrl.deleteResto);
    apiRouter.route('/resto/likeResto').post(ValidatorMiddlewares(likeRestoSchema), authMiddleware, restoCtrl.likeResto);
    apiRouter.route('/resto/unLikeResto').post(ValidatorMiddlewares(unLikeRestoSchema), authMiddleware, restoCtrl.unLikeResto);
    apiRouter.route('/resto/makeReservation').post(authMiddleware, restoCtrl.makeReservation);
    apiRouter.route('/resto/skipReservation').post(authMiddleware, restoCtrl.skipReservation);
    
    // put routes
    apiRouter.route('/resto/updateResto/:id').put(ValidatorMiddlewares(updateRestoSchema), authMiddleware, restoCtrl.updateResto);
};