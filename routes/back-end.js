var express = require('express');
var router = express.Router();
// mongojs
var mongojs = require('mongojs');
var db = mongojs("e5ojs_db",['e5ojs_user']);
// format date
var date_format = require('dateformat');
var current_date = new Date();
// remove diacritics
var remove_diacritics = require('diacritics').remove;








// e5ojs global data
var e5ojs_global_data = {
    'e5ojs_base_url':'',
    'e5ojs_current_url':'',
    'e5ojs_current_date':date_format(current_date,'dd-mm-yyyy')
};
function e5ojs_global_data_generate(req) {
    e5ojs_global_data.e5ojs_base_url = req.protocol+"://"+req.get('host');
    e5ojs_global_data.e5ojs_current_url = req.protocol+"://"+req.get('host')+req.originalUrl;
    console.log("e5ojs_global_data : ",e5ojs_global_data);
}






// FROM: http://www.mongodb.org/display/DOCS/Updating#Updating-update%28%29
//
// db.collection.update( criteria, objNew, upsert, multi )
//   criteria - query which selects the record to update;
//   objNew - updated object or $ operators (e.g., $inc) which manipulate the object
//   upsert - if this should be an "upsert"; that is, if the record does not exist, insert it
//   multi - if all documents matching criteria should be updated
//
// db.myCollection.update({condField: 'condValue'}, { $set: { dateField: new Date(2011, 0, 1)}}, false, true);










/* start login session */
router.get('/', function(req, res, next) {
    e5ojs_global_data_generate(req);
    // validate session with session vars
    e5ojs_validate_admin_request_session_vars(req,res,next);
});
router.post('/', function(req, res, next) {
    e5ojs_global_data_generate(req);
    // validate session with post data request
    var user_name = req.body.user_name;
    var user_pass = req.body.user_pass;
    e5ojs_validate_admin_session_db(user_name,user_pass,req,res,next);
});
router.get('/admin', function(req, res, next) {
    e5ojs_global_data_generate(req);
    // validate session with session vars
    e5ojs_validate_admin_request_session_vars(req,res,next);
});
router.get('/log-out', function(req, res, next) {
    e5ojs_global_data_generate(req);
    // clear session data
    var e5ojs_session = req.session;
    e5ojs_session.e5ojs_user_data = null;
    e5ojs_session.destroy();
    // return log-in page
    res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
});
/* start login session */













/* start admin pages */
router.get('/pages/', function(req, res, next) {
    // get page with validate session
    e5ojs_get_admin_page(req, res, next,'e5ojs-admin-pages', 'PAGES');
});
router.get('/media/', function(req, res, next) {
    // get page with validate session
    e5ojs_get_admin_page(req, res, next,'e5ojs-admin-media', 'MEDIA');
});
router.get('/settings/', function(req, res, next) {
    // get page with validate session
    e5ojs_get_admin_page(req, res, next,'e5ojs-admin-settings', 'SETTINGS');
});
router.get('/posts/:post_status/', function(req, res, next) {
    /*
    get all posts with status passed in URL example: posts/post_status or all will be all status
    http://nodejs.dev/admin/posts/all/
    */
    // get page with validate session
    e5ojs_global_data_generate(req);

    // get post status
    var post_status = req.params.post_status;
    var post_status_array = Array();
    if( post_status == "all" ) {
        post_status_array = Array('publish','pending','trash');
    } else {
        if( post_status == 'publish' )
            post_status_array.push("publish");
        if( post_status == 'pending' )
            post_status_array.push("pending");
        if( post_status == 'trash' )
            post_status_array.push("trash");
    }

    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // exists vars
        var user_name = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // check session on DB
        e5ojs_validate_admin_session_db_callback(user_name,user_pass,req,res,next,function(user_data){
            if( user_data.result_login ) {
                // get posts
                var limit_post = 12;
                var skip_posts = 0;
                var total_pages = 0;
                var current_page = 1;
                var total_post = 0;
                // total pages
                db.e5ojs_post.find({'post_status':{$in:post_status_array}}).sort({'post_date':-1}).count(function(q_req, q_res, q_next){
                    total_post = parseInt(q_res);
                    total_pages = parseInt(total_post/limit_post);
                });
                // query with skip page
                db.e5ojs_post.find({'post_status':{$in:post_status_array}}).sort({'post_date':-1}).skip(skip_posts).limit(limit_post, function(err, posts){
                    // check if has message session
                    // get session message
                    var e5ojs_message = e5ojs_get_session_message(req);
                    // remove session message
                    e5ojs_clear_session_message(req);
                    // validate error
                    if(err)
                        res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data, result_query_db:1, result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, e5ojs_message:e5ojs_message, post_status:post_status });
                    else
                        res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data, result_query_db:1, result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, e5ojs_message:e5ojs_message, post_status:post_status });
                });

            } else {
                // clear session data
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                // return log-in page
                res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data, result_data:null });
            }
        });
    } else {
        // doesn´t exists vars
        // clear session data
        var e5ojs_session = req.session;
        e5ojs_session.e5ojs_user_data = null;
        e5ojs_session.destroy();
        // return log-in page
        res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
    }
});
router.get('/posts/:post_status/page/:page/', function(req, res, next) {
    /*
    get all posts with post status and paginated
    */
    // get page with validate session
    e5ojs_global_data_generate(req);

    // get post status
    var post_status = req.params.post_status;
    var post_status_array = Array();
    if( post_status == "all" ) {
        post_status_array = Array('publish','pending','trash');
    } else {
        if( post_status == 'publish' )
            post_status_array.push("publish");
        if( post_status == 'pending' )
            post_status_array.push("pending");
        if( post_status == 'trash' )
            post_status_array.push("trash");
    }

    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // exists vars
        var user_name = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // check session on DB
        e5ojs_validate_admin_session_db_callback(user_name,user_pass,req,res,next,function(user_data){
            if( user_data.result_login ) {
                // get posts
                // get total pages
                var limit_post = 12;
                var skip_posts = 0;
                var total_post = 0;
                if( parseInt(req.params.page) == 1 ) {
                    skip_posts = 0;
                } else {
                    skip_posts = (parseInt(req.params.page)-1)*limit_post;
                }
                var total_pages = 0;
                var current_page = req.params.page;
                // total pages
                db.e5ojs_post.find({'post_status':{$in:post_status_array}}).count(function(q_req, q_res, q_next){
                    total_post = parseInt(q_res);
                    total_pages = parseInt(total_post/limit_post);
                });
                // query with skip page
                db.e5ojs_post.find({'post_status':{$in:post_status_array}}).sort({"post_date":-1}).skip(skip_posts).limit(limit_post, function(err, posts){
                    // validate error
                    res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data, result_query_db:1, result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, post_status:post_status });
                });

            } else {
                // clear session data
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                // return log-in page
                res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data, result_data:null });
            }
        });
    } else {
        // doesn´t exists vars
        // clear session data
        var e5ojs_session = req.session;
        e5ojs_session.e5ojs_user_data = null;
        e5ojs_session.destroy();
        // return log-in page
        res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
    }
});
router.get('/posts/action/new-post/', function(req, res, next) {
    /*
    get template for add new post
    */
    // get page with validate session
    e5ojs_get_admin_page(req, res, next,'e5ojs-admin-new-post', 'NEW POST');
});
router.get('/posts/action/edit-post/:post_id/', function(req, res, next) {
    /*
    get template with post data it will be edited
    */
    // get post data to show and edit
    e5ojs_global_data_generate(req);

    // show post data
    var post_id = req.params.post_id; // get url parm post_id

    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // exists vars
        var user_name = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // check session on DB
        e5ojs_validate_admin_session_db_callback(user_name,user_pass,req,res,next,function(user_data){
            if( user_data.result_login ) {
                // get post data with id
                e5ojs_get_post(post_id,function(post_data){
                    // validate error
                    // check if has message session
                    // get session message
                    var e5ojs_message = e5ojs_get_session_message(req);
                    // remove session message
                    e5ojs_clear_session_message(req);
                    res.render('back-end/e5ojs-admin-edit-post', { title: "EDIT POST", e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data, result_query_db:1, result_query_data:post_data, e5ojs_message:e5ojs_message });
                });
            } else {
                // clear session data
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                // return log-in page
                res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
            }
        });
    } else {
        // doesn´t exists vars
        // clear session data
        var e5ojs_session = req.session;
        e5ojs_session.e5ojs_user_data = null;
        e5ojs_session.destroy();
        // return log-in page
        res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
    }
});
router.post('/posts/action/edit-post/:post_id/:post_status', function(req, res, next) {
    /*
    update post data with post id and post status passed by URL
    */
    // update post data
    e5ojs_global_data_generate(req);
    // get post status
    var post_status_req = req.params.post_status; // get url parm post_id
    var post_status = "publish";
    // validate post_status
    if( post_status_req == 'publish' )
        post_status = "publish";
    if( post_status_req == 'pending' )
        post_status = "pending";
    if( post_status_req == 'trash' )
        post_status = "trash";


    // get post id
    var post_id = req.params.post_id; // get url parm post_id

    // get post data
    var post_title = req.body.post_title;
    var post_content = req.body.post_content;
    var post_format_date = req.body.post_date;
    var post_date = req.body.post_date_submit;
    var post_excerpt = req.body.post_excerpt;

    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // exists vars
        var user_name = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // check session on DB
        e5ojs_validate_admin_session_db_callback(user_name,user_pass,req,res,next,function(user_data){
            if( user_data.result_login ) {
                // update post on DB
                // generate post name
                var post_name = post_title.replace(/\s+/g, '-').toLowerCase();
                var post_name = remove_diacritics(post_name);
                e5ojs_update_post( {post_id:parseInt(post_id),post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_status:post_status},function(result_data){
                    // validate result

                    // create session message
                    var e5ojs_message = null;
                    // show notification
                    e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post edited'};
                    // save message on session var
                    e5ojs_push_session_message(req,e5ojs_message);

                    // redirect to edit post with ID
                    res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/posts/action/edit-post/"+result_data.post_id);
                    //res.render('back-end/e5ojs-admin-edit-post', { title: "EDIT POST", e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data, result_query_db:1, result_query_data:result_data });
                });

            } else {
                // clear session data
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                // return log-in page
                res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
            }
        });
    } else {
        // doesn´t exists vars
        // clear session data
        var e5ojs_session = req.session;
        e5ojs_session.e5ojs_user_data = null;
        e5ojs_session.destroy();
        // return log-in page
        res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
    }
});
router.post('/posts/action/new-post/:post_status', function(req, res, next) {
    /*
    insert a new post with post status passed by URL
    */
    e5ojs_global_data_generate(req);
    // save post data
    // get post status
    var post_status_req = req.params.post_status; // get url parm post_id
    var post_status = "publish";
    // validate post_status
    if( post_status_req == 'publish' )
        post_status = "publish";
    if( post_status_req == 'pending' )
        post_status = "pending";
    if( post_status_req == 'trash' )
        post_status = "trash";

    // get post data
    var post_title = req.body.post_title;
    var post_content = req.body.post_content;
    var post_format_date = req.body.post_date;
    var post_date = req.body.post_date_submit;
    var post_excerpt = req.body.post_excerpt;

    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // exists vars
        var user_name = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // check session on DB
        e5ojs_validate_admin_session_db_callback(user_name,user_pass,req,res,next,function(user_data){
            if( user_data.result_login ) {
                // save new post on DB
                //db.e5ojs_post.insert({post_id:});
                e5ojs_get_next_id('post',function(data){
                    var next_id = data.seq;
                    // insert post data
                    var post_name = post_title.replace(/\s+/g, '-').toLowerCase();
                    var post_name = remove_diacritics(post_name);
                    e5ojs_insert_new_post({post_id:next_id,post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_status:post_status},function(result_data){
                        // validate result
                        // create session message
                        var e5ojs_message = null;
                        // show notification
                        e5ojs_message = {'status':1,'type':'done','text':'Successfully - New post created'};
                        // save message on session var
                        e5ojs_push_session_message(req,e5ojs_message);
                        // redirect to edit post with ID
                        res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/posts/action/edit-post/"+result_data.post_id);
                    });

                });

            } else {
                // clear session data
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                // return log-in page
                res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
            }
        });
    } else {
        // doesn´t exists vars
        // clear session data
        var e5ojs_session = req.session;
        e5ojs_session.e5ojs_user_data = null;
        e5ojs_session.destroy();
        // return log-in page
        res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
    }
});
router.get('/posts/action/:post_status/:post_id/', function(req, res, next) {
    /*
    update one choose post status from multiple posts ids
    only change post status passed from url example: post_status/post_id
    http://nodejs.dev/admin/posts/action/delete/79
    */

    // change post status to trash
    e5ojs_global_data_generate(req);
    // get action
    var request_action = req.params.post_status;
    // get post id param
    var post_id = req.params.post_id; // get url parm post_id
    // check if has multiples ids
    var post_ids = post_id.split(",");


    //console.log("ACTION : ",request_action);
    /*return false;*/
    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // exists vars
        var user_name = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // check session on DB
        e5ojs_validate_admin_session_db_callback(user_name,user_pass,req,res,next,function(user_data){
            if( user_data.result_login ) {

                // validate post status
                var post_set_status = "pending";
                if( request_action == "publish" ) {
                    post_set_status = "publish";
                } else if( request_action == "pending" ) {
                    post_set_status = "pending";
                } else if( request_action == "delete" ) {
                    post_set_status = "trash";
                }
                //console.log("post_set_status : ",post_set_status);
                // multiple post ids
                // update posts
                e5ojs_change_post_status_multiple(post_ids,post_set_status,function(data){
                    // create session message
                    // validate result
                    var e5ojs_message = null;
                    if( data.status ) {
                        // show notification
                        e5ojs_message = {'status':1,'type':'done','text':'Successfully - Moved to '+post_set_status};
                    } else {
                        e5ojs_message = {'status':1,'type':'error','text':'Error - Tried to move to '+post_set_status};
                    }
                    // save message on session var
                    e5ojs_push_session_message(req,e5ojs_message);
                    // redirect to posts archive
                    res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/posts/all/");
                });

            } else {
                // clear session data
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                // return log-in page
                res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
            }
        });
    } else {
        // doesn´t exists vars
        // clear session data
        var e5ojs_session = req.session;
        e5ojs_session.e5ojs_user_data = null;
        e5ojs_session.destroy();
        // return log-in page
        res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
    }
});

/* end admin pages */


















/* start set session message */
function e5ojs_push_session_message(req,message_object) {
    var e5ojs_session = req.session;
    e5ojs_session.e5ojs_message = message_object;
}
function e5ojs_get_session_message(req) {
    var e5ojs_session = req.session;
    var message_object = {};
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_message !== 'undefined' && e5ojs_session.e5ojs_message != null ) {
         message_object = e5ojs_session.e5ojs_message;
    }
    return message_object;
}
function e5ojs_clear_session_message(req) {
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_message !== 'undefined' && e5ojs_session.e5ojs_message != null ) {
         delete e5ojs_session.e5ojs_message;
    }
}
/* end set session message */
















/* start post DB functions */
/*
if "new:true" found object data and override with new object data
if "new:false"  found object data but only update the passed fileds
*/
function e5ojs_get_next_id(name,callback) {
    db.e5ojs_counter.findAndModify({query: { '_id': name },update: { $inc: { 'seq': 1 } },new: true},function(err, data){
        // validate error
        callback(data);
    });
}
function e5ojs_insert_new_post(post_data,callback) {
    db.e5ojs_post.insert(post_data,function(err, result_data){
        // validate error
        callback(result_data);
    });
}
function e5ojs_get_post(post_id,callback) {
    db.e5ojs_post.find({'post_id':parseInt(post_id)},function(err,post_data){
        // validate error
        callback(post_data);
    });
}
function e5ojs_update_post(post_data,callback) {
    // param new: true to return the modification post
    db.e5ojs_post.findAndModify({query: { 'post_id': parseInt(post_data.post_id) },update: post_data,new: false},function(err, result_data){
        // validate error
        callback(result_data);
    });
}
function e5ojs_change_post_status(post_id,status,callback) {
    db.e5ojs_post.update( {'post_id':parseInt(post_id)}, { $set: {'post_status': status} }, {new: false,multi: true}, function(err, result_data){
        // return : { ok: 1, nModified: 1, n: 1 } mod
        // return : { ok: 1, nModified: 0, n: 0 } no mod
        if( err ) {
            callback({ok:0});
        } else {
            if( result_data.nModified > 0 ) {
                callback({status:1});
            } else {
                callback({status:0});
            }
        }
    });
}
function e5ojs_change_post_status_multiple(post_ids,status,callback) {
    var ids_array = Array();
    post_ids.forEach(function(val,key){
        ids_array.push( parseInt(post_ids[key]) );
    });
    db.e5ojs_post.update({'post_id':{$in:ids_array}},{$set:{'post_status':status}},{new: false,multi: true},function(err, result_data){
        // result : WriteResult({ "nMatched" : 3, "nUpserted" : 0, "nModified" : 3 })
        if( err ) {
            callback({ok:0});
        } else {
            if( result_data.nModified > 0 ) {
                callback({status:1});
            } else {
                callback({status:0});
            }
        }
    });
}

/* end post DB functions */


















/* start validate admin session */
function e5ojs_get_admin_page(req, res, next,template_name,title) {
    e5ojs_global_data_generate(req);
    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // exists vars
        var user_name = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // check session on DB
        e5ojs_validate_admin_session_db_callback(user_name,user_pass,req,res,next,function(user_data){
            console.log("user_data : ",user_data);
            if( user_data.result_login ) {
                res.render('back-end/'+template_name, { title: title, e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data });
            } else {
                // clear session data
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                // return log-in page
                res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
            }
        });
    } else {
        // doesn´t exists vars
        // clear session data
        var e5ojs_session = req.session;
        e5ojs_session.e5ojs_user_data = null;
        e5ojs_session.destroy();
        // return log-in page
        res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:null });
    }
    // validate session with callback
}
function e5ojs_validate_admin_session_db_callback(user_login,user_pass,req,res,next,callback) {
    console.log("E5OJS - ","e5ojs_validate_admin_session_db_callback");
    // get post user data
    var user_name = user_login;
    var user_pass = user_pass;
    // validate user on DB
    db.e5ojs_user.find({'user_login':user_name,'user_pass':user_pass}, function(err, user){
        if( err ) {
            var e5ojs_session = req.session;
            e5ojs_session.e5ojs_user_data = null;
            e5ojs_session.destroy();
            //console.log("NO DATA USER - ",e5ojs_session);
            callback({ result_data:err});
            //res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:err });
        } else {
            //console.log(user[0].user_name);
            if( user.length ) {
                // save user data on session var
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = user[0];
                //console.log("DATA USER - ",e5ojs_session);
                callback({ result_data:user, result_login:1 });
                //res.render('back-end/e5ojs-admin', { title: 'E5OJS', e5ojs_global_data:e5ojs_global_data, result_data:user });
            } else {
                // no user data exists on DB
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                //console.log("NO DATA USER - ",e5ojs_session);
                callback({ result_data:user, result_login:0 });
                //res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:user });
            }
        }
    });
}
function e5ojs_validate_admin_session_db(user_login,user_pass,req,res,next) {
    console.log("E5OJS - ","e5ojs_validate_admin_session_db");
    // get post user data
    var user_name = user_login;
    var user_pass = user_pass;
    // validate user on DB
    db.e5ojs_user.find({'user_login':user_name,'user_pass':user_pass}, function(err, user){
        if( err ) {
            var e5ojs_session = req.session;
            e5ojs_session.e5ojs_user_data = null;
            e5ojs_session.destroy();
            //console.log("NO DATA USER - ",e5ojs_session);
            res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:err });
        } else {
            //console.log(user[0].user_name);
            if( user.length ) {
                // save user data on session var
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = user[0];
                //console.log("DATA USER - ",e5ojs_session);
                res.render('back-end/e5ojs-admin', { title: 'DASHBOARD', e5ojs_global_data:e5ojs_global_data, result_data:user });
            } else {
                // no user data exists on DB
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                //console.log("NO DATA USER - ",e5ojs_session);
                res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data, result_data:user });
            }
        }
    });
}
function e5ojs_validate_admin_request_session_vars(req,res,next) {
    console.log("E5OJS - ","e5ojs_validate_admin_request_session_vars");
    var e5ojs_session = req.session;
    console.log(e5ojs_session);
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // session vars found and validate
        // get session data
        var user_name = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // validate session on DB
        e5ojs_validate_admin_session_db(user_name,user_pass,req,res,next);
    } else {
        // no session vars found
        e5ojs_session.e5ojs_user_data = null;
        e5ojs_session.destroy();
        res.render('back-end/e5ojs-index', { title: 'E5OJS - LOG-IN', e5ojs_global_data:e5ojs_global_data });
    }
}
/* end validate admin session */










module.exports = router;
