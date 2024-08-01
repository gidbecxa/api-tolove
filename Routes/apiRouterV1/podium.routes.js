// Imports
const podiumCtrl = require('../../Controllers/podium.controllers');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const {
    removeUserFromPodiumSchema, 
} = require('../../Utils/validationShema');

module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/podium/getWorldUsers').get(authMiddleware, podiumCtrl.getWorldPodiumUser);
    apiRouter.route('/podium/getCountryUsers').get(authMiddleware, podiumCtrl.getCountryPodiumUser);
    apiRouter.route('/podium/getStarPodium').get(authMiddleware, podiumCtrl.getStarPodium);
    
    apiRouter.route('/podium/getOnlineUsers').get(authMiddleware, podiumCtrl.getOnlineUsers);
    apiRouter.route('/podium/getOnlineUsersInSameCountry/:id').get(authMiddleware, podiumCtrl.getOnlineUsersInSameCountry);
    apiRouter.route('/podium/checkIfUserIsOnPodium/:id').get(authMiddleware, podiumCtrl.checkIfUserIsOnPodium);

    // post routes
    apiRouter.route('/podium/addUserToWorldPodium/:id').post(authMiddleware, podiumCtrl.addWorldPodiumUser);
    apiRouter.route('/podium/addUserToCountryPodium/:id').post(authMiddleware, podiumCtrl.addCountryPodiumUser);

    apiRouter.route('/podium/removeUserFromPodium/:id').put(ValidatorMiddlewares(removeUserFromPodiumSchema), authMiddleware, podiumCtrl.removeUserFromPodium);
};