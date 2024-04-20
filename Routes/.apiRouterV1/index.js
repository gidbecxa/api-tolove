var express = require('express');
const authRoutes = require('./auth.routes')
const adminRoutes = require('./agents.routes');
const usersRoutes = require('./users.routes');
const countryRoutes = require('./country.routes');
const cityRoutes = require('./city.routes');
const podiumRoutes = require('./podium.routes');
const restoRoutes = require('./resto.routes');
const hostelRoutes = require('./hostel.routes');

exports.router = (function() {

    const apiRouter = express.Router();

    //Auth route
    authRoutes(apiRouter)
    
    // Admin routes
    adminRoutes(apiRouter)

    // Users routes
    usersRoutes(apiRouter)

    // Country routes
    countryRoutes(apiRouter)
    
    // City routes
    cityRoutes(apiRouter)
    
    // Podium routes
    podiumRoutes(apiRouter)
    
    // Resto routes
    restoRoutes(apiRouter)
    
    // Hostel routes
    hostelRoutes(apiRouter)

    return apiRouter;
    
})();