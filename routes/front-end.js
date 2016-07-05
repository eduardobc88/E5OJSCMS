/* ============== start e5ojs requires ============== */

var express = require('express');
var router = express.Router();
// format date
var date_format = require('dateformat');
var current_date = new Date();
// mongojs
var mongojs = require('mongojs');
var db = mongojs("e5ojs_db");// choose DB

/* ============== end e5ojs requires ============== */

















/* ============== start e5ojs global var ============== */

var e5ojs_global_data = {};

/* ============== end e5ojs global var ============== */




















/* ============== start e5ojs configuration ============== */

/* start e5ojs generate global data */
function e5ojs_global_data_init() {
    //var host_url = req.protocol+"://"+req.get('host');
    var host_url = "http://nodejs.dev"; // change for current host ip or domain
    e5ojs_global_data.home_page = "";
    e5ojs_global_data.pages = [];
    e5ojs_global_data.post_types = [];
    e5ojs_global_data.res = {
        base_url: host_url,
        current_url: host_url,
        media_uploads_url: host_url+'/uploads/',
        media_uploads_sizes_url: host_url+'/uploads/sizes/',
        media_default_image_url: host_url+'/back-end/assets/default-post-img.png',
        media_default_image_gallery: "https://placeholdit.imgix.net/~text?txtsize=20&bg=a4a4a4&txtclr=FFFFFF&txt=IMAGE&w=100&h=100&txttrack=0",
        current_date: date_format(current_date,'dd-mm-yyyy'),
    };
    e5ojs_global_data.admin_api = {
        get_all_media: host_url+"/admin/all-media/",
    };
    // generate page routers fisrt time
    e5ojs_generate_routers_for_pages();
    // genetate post type routers first time
    e5ojs_generate_routers_for_post_types();
}
/* end e5ojs generate global data */


/* start e5ojs regenerate page routers */
function e5ojs_regenetate_routers() {
    //console.log("======== E5OJS REGENERATE ROUTERS ========");
    // for pages
    for( var current_route_key in e5ojs_global_data.pages ) {
        var route_slug = e5ojs_global_data.pages[current_route_key];
        remove_route_stack(route_slug);
    }
    // for post types
    for( var current_route_key in e5ojs_global_data.post_types ) {
        var route_slug = e5ojs_global_data.post_types[current_route_key];
        remove_route_stack(route_slug);
    }
    // slug from router stack
    function remove_route_stack(route_slug) {
        for(var key_router in router.stack ) {
            var route = router.stack[key_router];
            if( route.route.path.toString().indexOf(route_slug) > 0 ) {
                router.stack.splice(key_router, 1);
            }
        }
    }
    //console.log(" ======== ROUTER ======== ",router.stack);
    e5ojs_global_data_init();
}
/* start e5ojs regenerate page routers */



// generate dinamic routers
e5ojs_generate_router_for_home_page();
e5ojs_global_data_init();

/* ============== end e5ojs configuration ============== */































/* ============== start e5ojs router ============== */



/* start e5ojs load dinamic page templates and generate routers */
function e5ojs_generate_routers_for_pages() {
    // remove routers
    // get all publish pages
    db.e5ojs_page.find({'page_status':'publish'}, function(err, e5ojs_pages_result){
        if( e5ojs_pages_result.length ) {
            // generate router for each page
            for( var key_page in e5ojs_pages_result ){
                var page_data = e5ojs_pages_result[key_page];
                e5ojs_generate_router_page(page_data);
            }
        }
    });
}
function e5ojs_generate_routers_for_post_types() {
    // remove routers
    // get all publish post types
    db.e5ojs_post_type.find({'post_type_status':1}, function(err, e5ojs_post_types_result){
        if( e5ojs_post_types_result.length ) {
            // generate router for each page
            for( var key_post_type in e5ojs_post_types_result ){
                var post_type_data = e5ojs_post_types_result[key_post_type];
                e5ojs_generate_router_post_type(post_type_data);
            }
        }
    });
}
function e5ojs_generate_router_for_home_page() {
    // remove home router
    router.get('/', function(req, res, next) {
        e5ojs_settings_get_all(function(result_settings){
            console.log("result_settings",result_settings);
            var page_home_id = "";
            for( settings_key in result_settings ) {
                if( result_settings[settings_key].settings_id == "settings_home_page_template" ) {
                    page_home_id = result_settings[settings_key].settings_value;
                    break;
                }
            }
            // get page
            e5ojs_page_get(page_home_id, function(result_page){
                var home_page = result_page[0];
                var page_data = home_page;
                e5ojs_global_data.home_page = page_home_id;
                res.render('front-end/'+page_data.page_template, { e5ojs_global_data:e5ojs_global_data, page_data:page_data });
            });
        });
    });
    /* start e5ojs generate home page router */
}
function e5ojs_generate_router_page(page_data) {
    //console.log("FRONTEND - Route",page_data.page_slug);
    e5ojs_global_data.pages.push(page_data.page_slug);
    router.get('/'+page_data.page_slug+'/', function(req, res, next) {
        res.render('front-end/'+page_data.page_template, { e5ojs_global_data:e5ojs_global_data, page_data:page_data });
    });
}
function e5ojs_generate_router_post_type(post_type_data) {
    e5ojs_global_data.post_types.push(post_type_data.post_type_slug);
    // post type archive
    router.get('/'+post_type_data.post_type_slug+'/', function(req, res, next) {
        // get post type info
        var post_type_name = post_type_data.post_type_slug;
        e5ojs_get_post_type_by_name(post_type_name,function(post_type_data){
            if( post_type_data == null ) {
                // return 404
                e5ojs_res_404(req ,res, next);
            } else {
                var post_type_archive_template = post_type_data[0].post_type_archive_template;
                // validate template name
                console.log("E5OJS ARCHIVE ("+post_type_name+") data: ",post_type_archive_template);
                if( post_type_archive_template == "" )
                    post_type_archive_template = "e5ojs-template-default";
                res.render('front-end/'+post_type_archive_template, { e5ojs_global_data:e5ojs_global_data, page_data:post_type_data[0] });
            }
        });
    });
    // post type archive pagination
    router.get('/'+post_type_data.post_type_slug+'/page/:number_page/', function(req, res, next) {
        var number_page = req.params.number_page;
        var post_type_name = post_type_data.post_type_slug;
        e5ojs_get_post_type_by_name(post_type_name,function(post_type_data){
            if( post_type_data == null ) {
                // return 404
                e5ojs_res_404(req ,res, next);
            } else {
                var post_type_archive_template = post_type_data[0].post_type_archive_template;
                var post_type_id = post_type_data[0].post_type_id;

                // get posts
                // get total pages
                var limit_post = 12;
                var skip_posts = 0;
                var total_post = 0;
                if( parseInt(number_page) == 1 ) {
                    skip_posts = 0;
                } else {
                    skip_posts = (parseInt(number_page)-1)*limit_post;
                }
                var total_pages = 0;
                var current_page = number_page;
                // total pages
                e5ojs_get_total_posts_by_post_type(post_type_id, function(total_post_result){

                    total_post = parseInt(total_post_result.total_post);
                    total_pages = parseInt(total_post/limit_post);
                    total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+parseInt(total_post%limit_post));

                    // query with skip page
                    db.e5ojs_post.find({'post_status':'publish','post_post_type_id':parseInt(post_type_id)}).sort({'post_date':-1,'post_id':-1}).skip(skip_posts).limit(limit_post, function(err, posts){
                        // get pagination
                        var e5ojs_pagination = e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.res.base_url+"/"+post_type_name+"/");
                        // validate template name
                        console.log("E5OJS ARCHIVE PAGINATE ("+post_type_name+") posts: ",posts.length);
                        console.log("e5ojs_pagination",e5ojs_pagination);
                        if( post_type_archive_template == "" )
                            post_type_archive_template = "e5ojs-template-default";
                        res.render('front-end/'+post_type_archive_template, { e5ojs_global_data:e5ojs_global_data, page_data:post_type_data[0], e5ojs_posts:posts, e5ojs_pagination:e5ojs_pagination });
                    });
                });
            }
        });
    });

    // post type single
    router.get('/'+post_type_data.post_type_slug+'/:post_name/', function(req, res, next) {
        var post_name = req.params.post_name;
        // get post type info
        var post_type_name = post_type_data.post_type_slug;
        e5ojs_get_post_type_by_name(post_type_name,function(post_type_data){
            if( post_type_data == null ) {
                // return 404
                e5ojs_res_404(req ,res, next);
            } else {
                var post_type_single_template = post_type_data[0].post_type_single_template;
                var post_type_id = post_type_data[0].post_type_id;
                // validate template name
                // get post info
                e5ojs_get_post_type_post_by_name(post_type_id, post_name ,function(post_data){
                    console.log("post_data",post_data);
                    if( post_data == null || post_data.length == 0 ) {
                        // return 404
                        e5ojs_res_404(req ,res, next);
                    } else {
                        console.log("E5OJS ARCHIVE SINGLE : "+post_type_name+"/"+post_name+"/",post_data);
                        res.render('front-end/'+post_type_single_template, { e5ojs_global_data:e5ojs_global_data, page_data:post_data[0] });
                    }
                });
            }
        });
    });
}
/* end e5ojs load dinamic page templates and generate routers */




















/* start catch all GET request to check if refresh routers */
router.get('*', function(req, res, next) {

    // check for refresh routers
    if( req.app.locals.e5ojs_refresh_router == true ) {
        req.app.locals.e5ojs_refresh_router = false;
        e5ojs_regenetate_routers();
        next();
    } else {
        next();
    }
});
/* start catch all GET request to check if refresh routers */





/* ============== end e5ojs router ============== */


























/* ============== start e5ojs mongodb functions =============== */
/*
if "new:true" found object data and override with new object data
if "new:false"  found object data but only update the passed fileds
*/

function e5ojs_settings_get_all(callback) {
    db.e5ojs_settings.find({},function(err, result_settings){
        if( err )
            callback(null);
        else
            callback(result_settings);
    });
}
function e5ojs_page_get(page_id, callback) {
    db.e5ojs_page.find({'page_id':parseInt(page_id)},function(err, result_page){
        if( err )
            callback(null);
        else
            callback(result_page);
    });
}






function e5ojs_get_post_type_by_name(post_type_name, callback) {
    db.e5ojs_post_type.find({'post_type_name':post_type_name},function(err,post_type_data){
        if( err )
            callback(null);
        else
            callback(post_type_data);
    });
}
function e5ojs_get_post_type_post_by_name(post_type_id, post_name ,callback) {
    // post_name: news/test-new
    db.e5ojs_post.find({'post_post_type_id':parseInt(post_type_id),'post_name':post_name},function(err,post_data){
        if( err )
            callback(null);
        else
            callback(post_data);
    });
}
function e5ojs_get_total_posts_by_post_type(post_type_id, callback) {
    db.e5ojs_post.find({'post_post_type_id':parseInt(post_type_id), 'post_status':'publish'}).count(function(err, total_result){
        if( err )
            callback({err:err, total_post:parseInt(0)});
        else {
            total_post = parseInt(total_result);
            callback({err:err, total_post:parseInt(total_result)});
        }
    });
}

/* ============== end e5ojs mongodb functions =============== */






















/* ============== start e5ojs function ============== */

function e5ojs_res_404(req ,res, next) {
    res.status(404);
    // respond with html page
    if( req.accepts('html') ) {
        res.render('error', { title: 'Error 404', message: 'Not Found', error: {status: '404', stack: 'Error: Not Found'} });
        return;
    }
    // respond with json
    if( req.accepts('json') ) {
        res.send({ error: 'Not found' });
        return;
    }
    // default to plain-text. send()
    res.type('txt').send('Not found');
}

/* start generate pagination */

function e5ojs_get_pagination(total_pages, current_page, total_post, base_url) {
    var range = 2;
    var e5ojs_pagintion = [];
    var e5ojs_pagination_count = 0;
    if( current_page == total_pages ) {
        e5ojs_pagintion[e5ojs_pagination_count++] = {url:base_url+'page/1/', number:1 ,current:'current'};
        return e5ojs_pagintion;
    }
    for (var p = 1; p < total_pages; ++p) {
        if( p >= (current_page-range) && p <= (current_page+range) ) {
            e5ojs_pagintion[e5ojs_pagination_count++] = {url:base_url+'page/'+p+'/', number:p, current:((p==current_page)?'current':'')};
        }
    }
    return e5ojs_pagintion;
}

/* end generate pagination */

/* ============== end e5ojs function ============== */







module.exports = router;
