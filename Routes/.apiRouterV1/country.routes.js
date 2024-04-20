// Imports
const countryCtrl = require('../../Controllers/country.controllers');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');
const {
    addCountrySchema, updateCountrySchema, deleteCountrySchema,
} = require('../../Utils/validationShema');

module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/countries/getAll/').get(authMiddleware, countryCtrl.getAll);
    apiRouter.route('/countries/getOne/:id').get(countryCtrl.getOne);

    // post routes
    apiRouter.route('/countries/searchCountry').post(countryCtrl.searchCountry);
    apiRouter.route('/countries/addCountry').post(ValidatorMiddlewares(addCountrySchema), countryCtrl.addCountry);
    apiRouter.route('/countries/deleteCountry/:id').post(ValidatorMiddlewares(deleteCountrySchema), authMiddleware, countryCtrl.deleteCountry);

    // put routes
    apiRouter.route('/countries/updateCountry/:id').put(ValidatorMiddlewares(updateCountrySchema), authMiddleware, countryCtrl.updateCountry);
};