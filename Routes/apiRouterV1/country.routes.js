// Imports
const countryCtrl = require('../../Controllers/country.controllers');
const { authMiddleware } = require('../../Middlewares/jwtauth.middlewares');
const { ValidatorMiddlewares } = require('../../Middlewares/validator.middlewares');
const {
    addCountrySchema,
} = require('../../Utils/validationShema');

module.exports = (apiRouter) => {
    // get routes
    apiRouter.route('/country/getAll').get(countryCtrl.getAll);
    apiRouter.route('/country/getOne/:id').get(countryCtrl.getOne);

    // post routes
    apiRouter.route('/country/searchCountry').post(countryCtrl.searchCountry);
    apiRouter.route('/country/addCountry').post(ValidatorMiddlewares(addCountrySchema), countryCtrl.addCountry);
    apiRouter.route('/country/deleteCountry/:id').post(authMiddleware, countryCtrl.deleteCountry);

    // put routes
    apiRouter.route('/country/updateCountry/:id').put(authMiddleware, countryCtrl.updateCountry);
};