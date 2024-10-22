// Imports
const cityCtrl = require('../../Controllers/city.controllers');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');
const {
    addCitySchema,
} = require('../../Utils/validationShema');

module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/city/getAll/').get(cityCtrl.getAll);
    apiRouter.route('/city/getOne/:id').get(cityCtrl.getOne);

    // post routes
    apiRouter.route('/city/searchCity').post(cityCtrl.searchCity);
    apiRouter.route('/city/addCity').post(ValidatorMiddlewares(addCitySchema), cityCtrl.addCity);
    apiRouter.route('/city/deleteCity/:id').post(authMiddleware, cityCtrl.deleteCity);

    // put routes
    apiRouter.route('/city/updateCity/:id').put(authMiddleware, cityCtrl.updateCity);
};