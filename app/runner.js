#!/usr/bin/env node

/**
 * Module dependencies.
 */
var app = require('./app'),
    http = require('http');

var port = normalizePort(process.env.PORT || '5000');
app.set('port', port);
/**
 * Get port from environment and store in Express.
 */
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test', { useMongoClient: true });
mongoose.Promise = global.Promise;
populateDb();

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, '0.0.0.0');
server.on('error', onError);
server.on('listening', onListening);
var io = require('socket.io').listen(server);
var count=0;

io.sockets.on('connection', function (socket) {
    count++;
    console.log('user connected');
    socket.broadcast.emit('counter', {count:count});
    socket.on('disconnect', function() {
        count--;
        console.log('user disconnected');
        socket.broadcast.emit('counter', {count:count});
    });
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}

function populateDb() {
    mongoose.connection.on('open', function (err) {
        mongoose.connection.db.dropDatabase();
    });
    var fs = require('fs');
    var userManager = require('./managers/userManager');
    var branchManager = require('./managers/branchManager');
    var articleManager = require('./managers/articleManager');
    var currentFolder = require('path').dirname(require.main.filename);
    var contents = fs.readFileSync(currentFolder + '/startup.json');
    var jsonContent = JSON.parse(contents);
    var users = jsonContent.users;
    var branches = jsonContent.branches;
    var articles = jsonContent.articles;
    var transactions = jsonContent.transactions;
    users.forEach(function (user, index) {
        userManager.createUser(function (err, newUser) {
                console.log('Created user: ' + user.email);
                transactions.forEach(function (transaction, tindex) {
                    userManager.addTransaction(function (err, user) {
                    }, newUser, transaction)
                });
            },
            user);
    });
    branches.forEach(function (branch, index) {
        branchManager.createBranch(function (err, id) {},
            branch)
    });
    articles.forEach(function (article, index) {
        articleManager.createArticle(function (err, id) {},
            article)
    });

}