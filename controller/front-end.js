/* ============== start e5ojs requires ============== */
// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config.js");
// e5ojs end local requires settings

var express = require('express');
var router = express.Router();
// format date
var date_format = require('dateformat');
var current_date = new Date();
// mongodb
var e5ojs_db = require('../config/e5ojs-mongodb.js');

/* ============== end e5ojs requires ============== */

















/* ============== start e5ojs global var ============== */

var e5ojs_global_data = {};

/* ============== end e5ojs global var ============== */




















/* ============== start e5ojs configuration ============== */

/* start e5ojs generate global data */
function e5ojs_global_data_init() {
    //var host_url = req.protocol+"://"+req.get('host');
    var host_url = e5ojs_config.e5ojs_host_url; // change for current host ip or domain
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
        remove_route_stack(route_slug); // remove page route
    }
    // for post types
    for( var current_route_key in e5ojs_global_data.post_types ) {
        var route_slug = e5ojs_global_data.post_types[current_route_key];
        remove_route_stack(route_slug); // remove post type route
        remove_route_stack(route_slug+"/page"); // remove pagination route
        remove_route_stack(route_slug+"/:post_name"); // remove single post type route
    }
    // slug from router stack
    function remove_route_stack(route_slug) {
        for(var key_router in router.stack ) {
            var route = router.stack[key_router];
            if( route.route.path.toString().indexOf(route_slug) > 0 ) {
                router.stack.splice(key_router, 1);
                break;
            }
        }
    }
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
    e5ojs_db.e5ojs_page.find({'page_status':'publish'}, function(err, e5ojs_pages_result){
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
    e5ojs_db.e5ojs_post_type.find({'post_type_status':1}, function(err, e5ojs_post_types_result){
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
        // get site settings
        e5ojs_settings_get_all(function(result_settings){
            var page_home_id = "";
            // get settings page template
            for( settings_key in result_settings ) {
                if( result_settings[settings_key].settings_id == "settings_home_page_template" ) {
                    page_home_id = result_settings[settings_key].settings_value;
                    break;
                }
            }
            // get settings page metas
            var settings_page_metas = [];
            for( settings_key in result_settings ) {
                if( result_settings[settings_key].settings_id == "settings_page_metas" ) {
                    settings_page_metas = result_settings[settings_key].settings_value;
                    break;
                }
            }
            // get page data
            e5ojs_page_get(page_home_id, function(result_page){
                var page_data = result_page[0];
                var page_meta_data = null;
                e5ojs_global_data.home_page = page_home_id;
                // get page meta
                e5ojs_get_post_meta(page_data.page_id, function(page_meta){
                    page_meta_data = page_meta;
                    // match meta settings with meta post
                    var post_meta_data = [];
                    for( key_meta in settings_page_metas ) {
                        var find = 0;
                        for( key_current_meta in page_meta_data ) {
                            //- console.log("meta - ",post_type_meta[key_meta]);
                            if( "meta_"+settings_page_metas[key_meta].page_meta_name == page_meta_data[key_current_meta].post_meta_name ) {
                                page_meta_data[key_current_meta].meta_name = settings_page_metas[key_meta].page_meta_name;
                                page_meta_data[key_current_meta].meta_type = settings_page_metas[key_meta].page_meta_type;
                                page_meta_data[key_current_meta].meta_title = settings_page_metas[key_meta].page_meta_title;
                                post_meta_data.push(page_meta_data[key_current_meta]);
                                find = 1;
                            }
                        }
                        if( find == 0 ) {
                            // add meta data
                            post_meta_data.push({meta_title:settings_page_metas[key_meta].page_meta_title,meta_type:settings_page_metas[key_meta].page_meta_type,meta_name:settings_page_metas[key_meta].page_meta_name,post_meta_value:""});
                        }
                    }
                    // render page with data
                    res.render('front-end/'+page_data.page_template, { e5ojs_global_data:e5ojs_global_data, e5ojs_page_data:page_data, e5ojs_page_meta_data:post_meta_data });
                });
            });
        });
    });
    /* start e5ojs generate home page router */
}
function e5ojs_generate_router_page(page_data_param) {

    e5ojs_global_data.pages.push(page_data_param.page_slug);
    router.get('/'+page_data_param.page_slug+'/', function(req, res, next) {
        // get site settings
        e5ojs_settings_get_all(function(result_settings){
            var page_home_id = "";
            // get settings page template
            for( settings_key in result_settings ) {
                if( result_settings[settings_key].settings_id == "settings_home_page_template" ) {
                    page_home_id = result_settings[settings_key].settings_value;
                    break;
                }
            }
            // get settings page metas
            var settings_page_metas = [];
            for( settings_key in result_settings ) {
                if( result_settings[settings_key].settings_id == "settings_page_metas" ) {
                    settings_page_metas = result_settings[settings_key].settings_value;
                    break;
                }
            }
            // get page data
            var page_data = page_data_param;
            var page_meta_data = null;
            e5ojs_global_data.home_page = page_home_id;
            // get page meta
            e5ojs_get_post_meta(page_data.page_id, function(page_meta){
                page_meta_data = page_meta;
                // match meta settings with meta post
                var post_meta_data = [];
                for( key_meta in settings_page_metas ) {
                    var find = 0;
                    for( key_current_meta in page_meta_data ) {
                        if( "meta_"+settings_page_metas[key_meta].page_meta_name == page_meta_data[key_current_meta].post_meta_name ) {
                            page_meta_data[key_current_meta].meta_name = settings_page_metas[key_meta].page_meta_name;
                            page_meta_data[key_current_meta].meta_type = settings_page_metas[key_meta].page_meta_type;
                            page_meta_data[key_current_meta].meta_title = settings_page_metas[key_meta].page_meta_title;
                            post_meta_data.push(page_meta_data[key_current_meta]);
                            //- console.log("meta - ",page_meta_data[key_current_meta]);
                            find = 1;
                        }
                    }
                    /*if( find == 0 ) {
                        // add meta data
                        post_meta_data.push({meta_title:settings_page_metas[key_meta].page_meta_title,meta_type:settings_page_metas[key_meta].page_meta_type,meta_name:settings_page_metas[key_meta].page_meta_name,post_meta_value:""});
                    }*/
                }
                // render page with data
                res.render('front-end/'+page_data_param.page_template, { e5ojs_global_data:e5ojs_global_data, e5ojs_page_data:page_data, e5ojs_page_meta_data:post_meta_data });
            });
        });

    });
}
function e5ojs_generate_router_post_type(post_type_data) {
    e5ojs_global_data.post_types.push(post_type_data.post_type_slug);
    // post type archive
    router.get('/'+post_type_data.post_type_slug+'/', function(req, res, next) {
        // redirect to post type archive paginated
        res.redirect('/'+post_type_data.post_type_slug+'/page/1/');
    });
    // post type archive pagination
    router.get('/'+post_type_data.post_type_slug+'/page/:number_page/', function(req, res, next) {
        var number_page = req.params.number_page;
        var post_type_name = post_type_data.post_type_slug;
        e5ojs_get_post_type_by_name(post_type_name,function(post_type_data_result){
            if( post_type_data == null ) {
                // return 404
                e5ojs_res_404(req ,res, next);
            } else {
                var e5ojs_post_type_data = post_type_data_result[0];
                var post_type_archive_template = e5ojs_post_type_data.post_type_archive_template;
                var post_type_id = e5ojs_post_type_data.post_type_id;

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
                    total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+((parseInt(total_post%limit_post) > 0)?2:1));
                    // query with skip page
                    e5ojs_db.e5ojs_post.find({'post_status':'publish','post_post_type_id':parseInt(post_type_id)}).sort({'post_date':-1,'post_id':-1}).skip(skip_posts).limit(limit_post, function(err, posts){
                        // get pagination
                        var e5ojs_pagination = e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.res.base_url+"/"+post_type_name+"/");
                        // validate template name
                        if( post_type_archive_template == "" )
                            post_type_archive_template = "e5ojs-template-default";
                        // before to send, you can query data from other page to include on render data params

                        // render template
                        res.render('front-end/'+post_type_archive_template, { e5ojs_global_data:e5ojs_global_data, e5ojs_archive_data:e5ojs_post_type_data, e5ojs_archive_post_data:posts, e5ojs_archive_pagination_data:e5ojs_pagination });
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
        e5ojs_get_post_type_by_name(post_type_name,function(post_type_data_result){

            if( post_type_data_result == null ) {
                // return 404
                e5ojs_res_404(req ,res, next);
            } else {
                var post_type_data = post_type_data_result[0];
                var post_type_single_template = post_type_data.post_type_single_template;
                var post_type_id = post_type_data.post_type_id;

                // get post type meta
                var post_type_meta = [];
                if( post_type_data != null) {
                    post_type_meta = post_type_data.post_type_meta;
                }

                // validate template name
                // get post info
                e5ojs_get_post_type_post_by_name(post_type_id, post_name ,function(post_data_result){

                    if( post_data_result == null || post_data_result.length == 0 ) {
                        // return 404
                        e5ojs_res_404(req ,res, next);
                    } else {
                        var post_data = post_data_result[0];
                        // get post metas
                        e5ojs_get_post_meta(post_data.post_id, function(post_meta_result){
                            var current_post_meta = post_meta_result;
                            // add post type meta data to post meta data
                            var post_meta_data = [];
                            for( key_meta in post_type_meta ) {
                                var find = 0;
                                for( key_current_meta in current_post_meta ) {
                                    if( "meta_"+post_type_meta[key_meta].meta_name == current_post_meta[key_current_meta].post_meta_name ) {
                                        current_post_meta[key_current_meta].meta_name = post_type_meta[key_meta].meta_name;
                                        current_post_meta[key_current_meta].meta_type = post_type_meta[key_meta].meta_type;
                                        current_post_meta[key_current_meta].meta_title = post_type_meta[key_meta].meta_title;
                                        post_meta_data.push(current_post_meta[key_current_meta]);
                                        find = 1;
                                    }
                                }
                                if( find == 0 ) {
                                    // add meta data
                                    post_meta_data.push({meta_title:post_type_meta[key_meta].meta_title,meta_type:post_type_meta[key_meta].meta_type,meta_name:post_type_meta[key_meta].meta_name,post_meta_value:""});
                                }
                            }
                            // render template
                            res.render('front-end/'+post_type_single_template, { e5ojs_global_data:e5ojs_global_data, e5ojs_post_data:post_data, e5ojs_post_meta_data:post_meta_data });
                        });
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
    if( e5ojs_config.e5ojs_refresh_router == true ) {
        e5ojs_config.e5ojs_refresh_router = false;
        console.log("==============e5ojs_regenetate_routers================");
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
    e5ojs_db.e5ojs_settings.find({},function(err, result_settings){
        if( err )
            callback(null);
        else
            callback(result_settings);
    });
}
function e5ojs_page_get(page_id, callback) {
    e5ojs_db.e5ojs_page.find({'page_id':parseInt(page_id)},function(err, result_page){
        if( err )
            callback(null);
        else
            callback(result_page);
    });
}






function e5ojs_get_post_type_by_name(post_type_name, callback) {
    e5ojs_db.e5ojs_post_type.find({'post_type_name':post_type_name},function(err,post_type_data){
        if( err )
            callback(null);
        else
            callback(post_type_data);
    });
}
function e5ojs_get_post_type_post_by_name(post_type_id, post_name ,callback) {
    // post_name: news/test-new
    e5ojs_db.e5ojs_post.find({'post_post_type_id':parseInt(post_type_id),'post_name':post_name},function(err,post_data){
        if( err )
            callback(null);
        else
            callback(post_data);
    });
}
function e5ojs_get_total_posts_by_post_type(post_type_id, callback) {
    e5ojs_db.e5ojs_post.find({'post_post_type_id':parseInt(post_type_id), 'post_status':'publish'}).count(function(err, total_result){
        if( err )
            callback({err:err, total_post:parseInt(0)});
        else {
            total_post = parseInt(total_result);
            callback({err:err, total_post:parseInt(total_result)});
        }
    });
}




/* start get post meta by id page or post */

function e5ojs_get_post_meta(post_id,callback) {
    e5ojs_db.e5ojs_post_meta.find({'post_meta_post_id':parseInt(post_id)},function(err,post_meta_result){
        if( err )
            callback(null);
        else
            callback(post_meta_result);
    });
}

/* start get post meta by id page or post */

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
