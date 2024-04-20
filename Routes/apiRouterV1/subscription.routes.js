// Imports
const subscriptionCtrl = require('../../Controllers/subscription.controllers');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');
const {
    addSubscriptionSchema,
} = require('../../Utils/validationShema');

module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/subscription/getAll/').get(subscriptionCtrl.getAll);
    apiRouter.route('/subscription/getOne/:id').get(subscriptionCtrl.getOne);

    // post routes
    apiRouter.route('/subscription/searchSubscription').post(subscriptionCtrl.searchSubscription);
    apiRouter.route('/subscription/addSubscription').post(ValidatorMiddlewares(addSubscriptionSchema), subscriptionCtrl.addSubscription);
    apiRouter.route('/subscription/deleteSubscription/:id').post(subscriptionCtrl.deleteSubscription);

    // put routes
    apiRouter.route('/subscription/updateSubscription/:id').put(subscriptionCtrl.updateSubscription);
};