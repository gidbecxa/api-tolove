// Imports
const { PORT, ENV } = require('./configEnv');
const express = require('express');
const bodyParser = require('body-parser');
// const {AuthMiddleware} = require('./Middlewares/jwtauth.middlewares')

const apiRouterV1 = require('./Routes/apiRouterV1/index').router

// Instantiate
var server = express();
const { upload } = require('./multerConfig');

// Import the setupSocketIO function

//Configuration
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

server.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});


server.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('<h1>Coucou! T\'es sur mon super server</h1>');
    // res.sendFile(__dirname + '/socket_test_client.html');
});


server.use('/api/v1', apiRouterV1);

// catch 404 and forward to error handler
server.use(function (req, res, err, next) {
    res.status(err.status || 404).json({
        message: "No such route exists"
    })
});


// error handler
server.use(function (err, req, res, next) {
    res.status(err.status || 500).json({
        message: "Error Message"
    })
});

// Launch server with the httpServer
httpServer.listen(PORT, () => {
    console.log('Server en écoute :)' + ' ' + PORT + ' ' + ENV);
});