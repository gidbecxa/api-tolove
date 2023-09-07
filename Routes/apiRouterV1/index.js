var express = require('express');
const authRoutes = require('./auth.routes')
const usersRoutes = require('./users.routes');
const adminRoutes = require('./agents.routes');

exports.router = (function() {

    const apiRouter = express.Router();

    //Auth route
    authRoutes(apiRouter)

    // Users routes
    usersRoutes(apiRouter)

    // Admin routes
    adminRoutes(apiRouter)

    return apiRouter;
    
})();