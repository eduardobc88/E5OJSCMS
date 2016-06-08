var express = require('express');
var router = express.Router();

/* GET Front End  */
router.get('/', function(req, res, next) {
    var host_url = "http://"+req.headers.host;
    res.render('front-end/e5ojs-index', { title: 'E5OJS - Front End', host_url:host_url });
});

module.exports = router;
