var express = require('express');
const authRoutes = require('./auth.routes')
const usersRoutes = require('./users.routes');
const adminRoutes = require('./agents.routes');
const countryRoutes = require('./country.routes');
const cityRoutes = require('./city.routes');
const companyRoutes = require('./company.routes');
const subscriptionRoutes = require('./subscription.routes');
const podiumRoutes = require('./podium.routes');
const carteRoutes = require('./carte.routes');

exports.router = (function() {

    const apiRouter = express.Router();

    //Auth route
    authRoutes(apiRouter)

    // Users routes
    usersRoutes(apiRouter)

    // Admin routes
    adminRoutes(apiRouter)

    // Country routes
    countryRoutes(apiRouter)
    
    // City routes
    cityRoutes(apiRouter)
    
    // Companyt routes
    companyRoutes(apiRouter)
    
    // Subscription routes
    subscriptionRoutes(apiRouter)

    // Podium routes
    podiumRoutes(apiRouter)
    
    // Carte routes
    carteRoutes(apiRouter)

    return apiRouter;
    
})();