var express = require('express');
var router = express.Router();
// format date
var date_format = require('dateformat');
var current_date = new Date();
// mongojs
var mongojs = require('mongojs');
var db = mongojs("e5ojs_db");// choose DB











/* start e5ojs generate global data */
var e5ojs_global_data = {};
function e5ojs_global_data_init() {
    //var host_url = req.protocol+"://"+req.get('host');
    var host_url = "http://nodejs.dev"; // change for current host ip or domain
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
e5ojs_global_data_init();
/* end e5ojs generate global data */








/* start e5ojs regenerate page routers */
function e5ojs_regenetate_routers() {
    console.log("======== E5OJS REGENERATE ROUTERS ========");
    /* start router pages */
    for( var current_route_key in e5ojs_global_data.pages ) {
        var route_slug = e5ojs_global_data.pages[current_route_key];
        remove_route_stack(route_slug);
    }
    function remove_route_stack(route_slug) {
        for(var key_router in router.stack ) {
            var route = router.stack[key_router];
            if( route.regexp.toString().indexOf(route_slug) > 0 ) {
                //console.log("remove route",route.regexp);
                router.stack.splice(key_router, 1);
            }
        }
    }
    /* end router pages */
    /* start router post types archive */

    /* end router post types archive */
    e5ojs_global_data_init();
}
/* start e5ojs regenerate page routers */


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
        console.log("E5OJS ARCHIVE : "+post_type_data.post_type_slug);
    });
    // post type single
    router.get('/'+post_type_data.post_type_slug+'/:post_name/', function(req, res, next) {
        var post_name = req.params.post_name;
        console.log("E5OJS ARCHIVE SINGLE : "+post_type_data.post_type_slug+"/"+post_name+"/");
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



















/* E5OJS start custom pages */
router.get('/', function(req, res, next) {
    var page_data = {};
    page_data = {
      page_title: 'front End /',
      page_content: 'No Content',
      page_excerpt: 'No excerpt ',
      page_date: '29-06-2016',
      page_media_id: '0',
      page_template: 'e5ojs-template-default',
      page_slug: '/'
    }
    res.render('front-end/e5ojs-index', { e5ojs_global_data:e5ojs_global_data, page_data:page_data });
});
/* E5OJS start custom pages */



















module.exports = router;
