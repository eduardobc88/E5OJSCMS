var express = require('express');
var router = express.Router();

/*  */
var mongojs = require('mongojs');
//var db = mongojs("e5ojs_db",['e5ojs_user']);
var db = mongojs("quantum_db",['wp_posts']);






/* GET index API */
router.get('/', function(req, res, next) {
    res.json(Array({"e5o_status":"ok"}));
});








/* start pagination */
router.get('/posts/page/', function(req, res, next) {
    var limit_post = 10;
    var skip_posts = 0;
    // query with skip page
    db.wp_posts.find({"post_type":"post"}).sort({"post_date":-1}).skip(skip_posts).limit(limit_post, function(err, posts){
        if( err ) {
            res.send(err);
        } else {
            res.json(posts);
        }
    });
    // total pages
    db.wp_posts.find({"post_type":"post"}).count(function(q_req, q_res, q_next){
        var limit_post = 10;
        var total_post = parseInt(q_res);
        var total_pages = parseInt(total_post/limit_post);
        console.log( "total_pages = "+total_pages );
    });
});
router.get('/posts/page/:page', function(req, res, next) {
    console.log("START PAGINATION REQUEST");
    var limit_post = 10;
    var skip_posts = parseInt(req.params.page)*limit_post;
    // query with skip page
    db.wp_posts.find({"post_type":"post"}).sort({"post_date":-1}).skip(skip_posts).limit(limit_post, function(err, posts){
        if( err ) {
            res.send(err);
        } else {
            res.json(posts);
        }
    });
    console.log("END PAGINATION REQUEST");
});
/* end pagination */


module.exports = router;
