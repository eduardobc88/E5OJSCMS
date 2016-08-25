var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var front_end = require('./controller/front-end');
var back_end = require('./controller/back-end');
var api = require('./controller/api');
var session = require("express-session");


// e5ojs global settings
var e5ojs_settings = require("./e5ojs-config.js");


/*
for mongodb backup data use:
mongodump
mongorestore file_path
in terminal.
The backup will be created on current terminal location on dump/ Folder
*/


// init express
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(bodyParser.json({limit: '2mb'})); // check limit file size on nginx config too
app.use(bodyParser.urlencoded({ extended: false, limit: '2mb' }));
app.use(cookieParser());
app.use(session({resave: false, saveUninitialized: true, secret: 'E5OA5A', cookie: { secure: false, maxAge: 6000000 }})); // express session
app.use(express.static(path.join(__dirname, 'public')));

//  root controller for different access
app.use('/', front_end);
app.use('/admin', back_end);
app.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    //res.render('error', { title: 'Error 404!', description_err:"Not Found" });
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
