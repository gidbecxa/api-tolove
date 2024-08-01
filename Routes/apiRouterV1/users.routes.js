// Imports
const usersCtrl = require('../../Controllers/users.controllers');
const twilioCtrl = require('../../Controllers/twilio.controller');
const stripeCtrl = require('../../Controllers/stripe.controller');
const companyCtrl = require('../../Controllers/company.controllers');
const carteCtrl = require('../../Controllers/carte.controllers');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');

const {
    updateUserSchema, updateHobbiesSchema, updateUserDescriptionSchema, updateProfilePartOneSchema, updateProfilePartTwoSchema, updateUserPhotoSchema,
    addUserCompanySchema, fetchUsersbyDistanceSchema
} = require('../../Utils/validationShema');
const { upload } = require('../../multerConfig');



module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/users/getusers').get(authMiddleware, usersCtrl.getMany);
    apiRouter.route('/users/getuser/:id').get(authMiddleware, usersCtrl.getUser);
    apiRouter.route('/users/me').get(authMiddleware, usersCtrl.getMe);
    apiRouter.route('/users/podium-country-filter/:pays').get(authMiddleware, usersCtrl.getUsersByCountryOrderedByPodium)

    apiRouter.route('/users/getusersByAgesInterval').get(authMiddleware, usersCtrl.getusersByAgesInterval);
    apiRouter.route('/users/getUsersInSameCountry/:id').get(authMiddleware, usersCtrl.getUsersInSameCountry);
    apiRouter.route('/users/getUsersOfSameDisponibility').get(authMiddleware, usersCtrl.getUsersOfSameDisponibility);

    apiRouter.route('/chatrooms/:id').get(authMiddleware, usersCtrl.getChatroomsByParticipant);
    apiRouter.route('/matches/:id').get(authMiddleware, usersCtrl.getUserMatches);
    apiRouter.route('/chatrooms/messages/:chatroomId').get(authMiddleware, usersCtrl.getAllChatroomMessages);

    apiRouter.route('/chatrooms/messagesNotReadCount/:chatroomId').get(authMiddleware, usersCtrl.getAllChatroomMessagesNotReadCount);

    apiRouter.route('/company/get-companies-annonces/:category').get(authMiddleware, companyCtrl.getCompaniesAnnonces);
    apiRouter.route('/company/get-companies-by-city/:category').get(authMiddleware, companyCtrl.getByCity);
    apiRouter.route('/company/pending-retraits/').get(authMiddleware, companyCtrl.getPendingRetraits);
    
    apiRouter.route('/chatrooms/last-message/:chatroomId').get(authMiddleware, usersCtrl.getLastMessage);
    apiRouter.route('/users/get-profile-photo/:id').get(authMiddleware, usersCtrl.getProfilePhoto);
    apiRouter.route('/gifts/get-gifts').get(authMiddleware, carteCtrl.getAllGifts);
    apiRouter.route('/gifts/get-gifts-by-category/:category').get(authMiddleware, carteCtrl.getAllGiftsByCategory);
    apiRouter.route('/purchases/sender/:senderId/receiver/:receiverId').get(authMiddleware, usersCtrl.getPurchasesByUsers);
    apiRouter.route('/purchases/receiver/:receiverId').get(authMiddleware, usersCtrl.getPurchasesForUser);
    apiRouter.route('/user/get-reservations/:userId').get(authMiddleware, carteCtrl.getUserReservations);

    apiRouter.route('/users-companies/search').get(authMiddleware, usersCtrl.searchDMAndDMP);
    apiRouter.route('/user/user-dm-companies/getAll').get(authMiddleware, usersCtrl.getUserCompanies);

    // put routes
    apiRouter.route('/users/update/complementpart1/:id').put(ValidatorMiddlewares(updateProfilePartOneSchema), authMiddleware, usersCtrl.updateProfilPartOne);
    apiRouter.route('/users/update/complementPart2/:id').put(authMiddleware, upload.single('image'), usersCtrl.updateProfilPartTwo);
    apiRouter.route('/users/update/:id').put(ValidatorMiddlewares(updateUserSchema), authMiddleware, usersCtrl.updateUser);
    apiRouter.route('/users/update/certified/:id').put(authMiddleware, usersCtrl.updateCertified);
    apiRouter.route('/users/update/completed/:id').put(authMiddleware, usersCtrl.updateCompleted);
    apiRouter.route('/users/update/hobbies/:id').put(ValidatorMiddlewares(updateHobbiesSchema), authMiddleware, usersCtrl.updateHobbies);
    apiRouter.route('/users/update/description/:id').put(ValidatorMiddlewares(updateUserDescriptionSchema), authMiddleware, usersCtrl.updateDescription);
    apiRouter.route('/users/update/profilePhoto/:id').put(authMiddleware, upload.single('image'), usersCtrl.updatePicture);
    apiRouter.route('/users/update/uploadPhoto/:id').put(authMiddleware, upload.single('image'), usersCtrl.uploadPhoto);
    apiRouter.route('/users/update/coins/:id').put(authMiddleware, usersCtrl.updateCoins);
    apiRouter.route('/purchase/update-delivery-info').put(authMiddleware, usersCtrl.updatePurchaseDeliveryInfo);

    // post routes
    apiRouter.route('/chatroom/:id/messages/read').put(authMiddleware, usersCtrl.updateMessagesStatusToRead);
    apiRouter.route('/users/join-room').post(twilioCtrl.joinRoom);
    apiRouter.route('/create-payment-intent').post(stripeCtrl.createPaymentIntent);
    apiRouter.route('/create-payment-methods').post(stripeCtrl.createPaymentMethods);
    apiRouter.route('/photos/presigned-url').post(usersCtrl.getPhotoWithUrl);
    apiRouter.route('/users/get-locked-user/:id').post(usersCtrl.getLockedUsers);
    apiRouter.route('/users/check-locked').post(authMiddleware, usersCtrl.checkLockedUsers);
    apiRouter.route('/chatrooms/getchatroom/by-participants').post(authMiddleware, usersCtrl.getChatRoomIdForUsers);
    apiRouter.route('/gifts/create-gift').post(authMiddleware, upload.single('image'), usersCtrl.createGift);
    apiRouter.route('/purchase/new-purchase').post(authMiddleware, usersCtrl.makePurchase);
    apiRouter.route('/annonce/new-reservation').post(authMiddleware, carteCtrl.makeReservation);
    apiRouter.route('/delete-account').post(authMiddleware, usersCtrl.requestAccountDelete);
    apiRouter.route('/user/user-dm-companies/addNew').post(ValidatorMiddlewares(addUserCompanySchema), usersCtrl.addUserCompany);
    apiRouter.route('/users/location-filter').post(ValidatorMiddlewares(fetchUsersbyDistanceSchema), authMiddleware, usersCtrl.fetchNearbyUsers)
};