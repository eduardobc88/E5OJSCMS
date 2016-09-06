/* start requeriments */

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookie_parser = require('cookie-parser');
var body_parser = require('body-parser');
var session = require("express-session");
var mongo_store = require('connect-mongo')(session);

/* end requeriments */


/* start local app requeriments */

// e5ojs global settings
var e5ojs_settings = require('./e5ojs-config/e5ojs-config.js');
// index router files
var front_end = require('./e5ojs-controllers/front-end');
var back_end = require('./e5ojs-controllers/back-end');
var api = require('./e5ojs-controllers/api');

/* end local app requeriments */







// init express
var app = express();

/* start confifure express app */

// set view engine setup
app.set('views', path.join(__dirname, 'e5ojs-views'));
app.set('view engine', 'pug');

// set favicon
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

// check limit file size on nginx config too
app.use(body_parser.json({limit: '2mb'}));
app.use(body_parser.urlencoded({ extended: false, limit: '2mb' }));
app.use(cookie_parser());
// set session mongo store
app.use(session({
     secret: 'E5OA5A',
     store: new mongo_store({url:'mongodb://localhost:27017/e5ojs_db'}),
     resave: false,
     saveUninitialized: true
}));
//app.use(session({resave: false, saveUninitialized: true, secret: 'E5OA5A', cookie: { secure: false, maxAge: 6000000 }})); // express session

// set public dir
app.use(express.static(path.join(__dirname, 'public')));

// set dir for template, admin and api
app.use('/', front_end);
app.use('/admin', back_end);
app.use('/api', api);

/* end confifure express app */


/* start error handler */

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

/* end error handler */




module.exports = app;
