// Imports
const usersCtrl = require('../../Controllers/users.controllers');
const twilioCtrl = require('../../Controllers/twilio.controller');
const stripeCtrl = require('../../Controllers/stripe.controller');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');

const {
    updateUserSchema, updateHobbiesSchema, updateUserDescriptionSchema, updateProfilePartOneSchema, updateUserPhotoSchema
} = require('../../Utils/validationShema');
const { upload } = require('../../multerConfig');



module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/users/getusers/').get(authMiddleware, usersCtrl.getMany);
    apiRouter.route('/users/getuser/:id').get(authMiddleware, usersCtrl.getUser);
    apiRouter.route('/users/me').get(authMiddleware, usersCtrl.getMe);

    apiRouter.route('/chatrooms/:id').get(authMiddleware, usersCtrl.getChatroomsByParticipant);
    apiRouter.route('/matches/:id').get(authMiddleware, usersCtrl.getUserMatches);
    apiRouter.route('/chatrooms/messages/:chatroomId').get(authMiddleware, usersCtrl.getAllChatroomMessages);
    apiRouter.route('/chatrooms/last-message/:chatroomId').get(authMiddleware, usersCtrl.getLastMessage);
    apiRouter.route('/users/get-profile-photo/:id').get(authMiddleware, usersCtrl.getProfilePhoto);

    // put routes
    apiRouter.route('/users/update/:id').put(ValidatorMiddlewares(updateUserSchema), authMiddleware, usersCtrl.updateUser);
    apiRouter.route('/users/update/certified/:id').put(authMiddleware, usersCtrl.updateCertified);
    apiRouter.route('/users/update/completed/:id').put(authMiddleware, usersCtrl.updateCompleted);
    apiRouter.route('/users/update/hobbies/:id').put(ValidatorMiddlewares(updateHobbiesSchema), authMiddleware, usersCtrl.updateHobbies);
    apiRouter.route('/users/update/description/:id').put(ValidatorMiddlewares(updateUserDescriptionSchema), authMiddleware, usersCtrl.updateDescription);
    apiRouter.route('/users/update/profilePhoto/:id').put(authMiddleware, upload.single('image'), usersCtrl.updatePicture);
    apiRouter.route('/users/update/uploadPhoto/:id').put(authMiddleware, upload.single('image'), usersCtrl.uploadPhoto);
    apiRouter.route('/users/update/coins/:id').put(authMiddleware, usersCtrl.updateCoins);

    // post routes
    apiRouter.route('/users/join-room').post(twilioCtrl.joinRoom);
    apiRouter.route('/create-payment-intent').post(stripeCtrl.createPaymentIntent);
    apiRouter.route('/create-payment-methods').post(stripeCtrl.createPaymentMethods);
    apiRouter.route('/users/update/complementpart1/:id').put(ValidatorMiddlewares(updateProfilePartOneSchema), authMiddleware, usersCtrl.updateProfilPartOne);
    apiRouter.route('/photos/presigned-url').post(usersCtrl.getPhotoWithUrl);
    apiRouter.route('/users/get-locked-user/:id').post(usersCtrl.getLockedUsers);
    apiRouter.route('/users/check-locked').post(authMiddleware, usersCtrl.checkLockedUsers);
    apiRouter.route('/chatrooms/getchatroom/by-participants').post(authMiddleware, usersCtrl.getChatRoomIdForUsers);
};