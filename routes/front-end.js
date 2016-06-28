var express = require('express');
var router = express.Router();
// mongojs
var mongojs = require('mongojs');
var db = mongojs("e5ojs_db");

/* GET Front End  */
router.get('/', function(req, res, next) {
    var host_url = "http://"+req.headers.host;
    res.render('front-end/e5ojs-index', { title: 'E5OJS - Front End', host_url:host_url });
});


/* start DB templates function */
function e5ojs_save_template(templates_array,callback) {
    db.e5ojs_templates.insert(templates_array,function(err,template_data_insert){
        callback(template_data_insert);
    });
}
/* end DB templates function */












module.exports = router;
