// Imports
const podiumCtrl = require('../../Controllers/podium.controllers');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');

module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/podium/getWorldUsers/').get(authMiddleware, podiumCtrl.getWorldUsersPodium);
    apiRouter.route('/podium/getCountryUsers/').get(authMiddleware, podiumCtrl.getCountryUsersPodium);
    apiRouter.route('/podium/getOnlineUsers/').get(authMiddleware, podiumCtrl.getOnlineUsers);
    apiRouter.route('/podium/getOnlineUsersInSameCountry/:id').get(authMiddleware, podiumCtrl.getOnlineUsersInSameCountry);
    apiRouter.route('/podium/checkIfUserIsOnPodium/:id').get(authMiddleware, podiumCtrl.checkIfUserIsOnPodium);

    // post routes
    apiRouter.route('/podium/addUserToWorldPodium/:id').post(authMiddleware, podiumCtrl.addUserToWorldPodium);
    apiRouter.route('/podium/addUserToCountryPodium/:id').post(authMiddleware, podiumCtrl.addUserToCountryPodium);
};