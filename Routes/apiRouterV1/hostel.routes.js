// Imports
const hostelCtrl = require('../../Controllers/hostel.controllers');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');
const {
    addHostelSchema, updateHostelSchema, deleteHostelSchema, likeHostelSchema, unLikeHostelSchema,
} = require('../../Utils/validationShema');

module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/hostel/getAll/').get(authMiddleware, hostelCtrl.getAll);
    apiRouter.route('/hostel/getOne/:id').get(authMiddleware, hostelCtrl.getOne);

    // post routes
    apiRouter.route('/hostel/searchHostel').post(hostelCtrl.searchHostel);
    apiRouter.route('/hostel/addHostel').post(ValidatorMiddlewares(addHostelSchema), authMiddleware, hostelCtrl.addHostel);
    apiRouter.route('/hostel/deleteHostel/:id').post(ValidatorMiddlewares(deleteHostelSchema), authMiddleware, hostelCtrl.deleteHostel);
    apiRouter.route('/hostel/likeHostel').post(ValidatorMiddlewares(likeHostelSchema), authMiddleware, hostelCtrl.likeHostel);
    apiRouter.route('/hostel/unLikeHostel').post(ValidatorMiddlewares(unLikeHostelSchema), authMiddleware, hostelCtrl.unLikeHostel);
    apiRouter.route('/hostel/makeReservation').post(authMiddleware, hostelCtrl.makeReservation);
    apiRouter.route('/hostel/skipReservation').post(authMiddleware, hostelCtrl.skipReservation);

    // put routes
    apiRouter.route('/hostel/updateHostel/:id').put(ValidatorMiddlewares(updateHostelSchema), authMiddleware, hostelCtrl.updateHostel);
};