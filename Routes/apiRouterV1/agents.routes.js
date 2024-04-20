// Imports
const agentsCtrl = require('../../Controllers/agents.controllers')
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
    // apiRouter.route('/agents/getuser/:id').get(agentsCtrl.getUser);
    // apiRouter.route('/agents/me').get(agentsCtrl.getMe);
    
    apiRouter.route('/agents/getNonCertified').get(agentsCtrl.getNonCertifiedUsers);

    apiRouter.route('/agents/chatrooms/:id').get(agentsCtrl.getChatroomsByParticipant);
    apiRouter.route('/agents/matches/:id').get(agentsCtrl.getAgentMatches);
    apiRouter.route('/agents/chatrooms/messages/:chatroomId').get(agentsCtrl.getAllChatroomMessages);
    apiRouter.route('/agents/:agentId/messages/count').get(agentsCtrl.countAgentMessages);
    apiRouter.route('/agents/chatrooms/last-message/:chatroomId').get(agentsCtrl.getLastMessage);
    apiRouter.route('/agents/get-profile-photo/:id').get(agentsCtrl.getProfilePhoto);

    // put routes
    // apiRouter.route('/agents/update/profilePhoto/:id').put(authMiddleware, upload.single('image'), agentsCtrl.updatePicture);
    apiRouter.route('/agents/update/uploadPhoto/:id').put(upload.single('image'), agentsCtrl.uploadPhoto);

    // post routes
    apiRouter.route('/agents/join-room').post(twilioCtrl.joinRoom);
    apiRouter.route('/agents/photos/presigned-url').post(agentsCtrl.getPhotoWithUrl);
    apiRouter.route('/agents/get-locked-user/:id').post(agentsCtrl.getLockedUsers);
    apiRouter.route('/agents/check-locked').post(agentsCtrl.checkLockedUsers);
    apiRouter.route('/agents/chatrooms/getchatroom/by-participants').post(agentsCtrl.getChatRoomIdForUsers);
};