/* ============== start e5ojs requires ============== */

var express = require('express');
var router = express.Router();
// MD5
var md5 = require('md5');
// mongojs
var mongojs = require('mongojs');
var db = mongojs("e5ojs_db");
// format date
var date_format = require('dateformat');
var current_date = new Date();
// remove diacritics
var remove_diacritics = require('diacritics').remove;
// generate slug from string
var getSlug = require('speakingurl');
// for image processing
var multer = require('multer');

/* ============== end e5ojs requires ============== */












/* ============== start e5ojs global var ============== */

var host_url = "http://nodejs.dev"; // change for current host ip or domain
var e5ojs_global_data = {}; // contains all urls for admin
// for image processing
var e5ojs_image_sizes = new Array({width:150,height:150},{width:200,height:200},{width:300,height:150},{width:800,height:200});
var image_sizes_pointer = 0;
var e5ojs_folder_images_sizes = "sizes/";
var e5ojs_sizes_return = {};


/* start filter upload files */
var maxSize = (2.5) * 1000 * 1000; // max file size 1 = 1024kb
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/../public/uploads/');
  },
  filename: function (req, file, cb) {
      // generate name for file
      var file_name = req.media_file_name;
      delete req.media_file_name;
      cb(null, file_name );
  }
});
var upload = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {
        if( file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/gif' ) {
            req.e5ojs_file_validation_error = true;
            return cb(null, false); // no save file
        } else {
            // ramdom string
            var random_string = require("randomstring");

            // get file data and save in DB
            var file_name_strip = getSlug(remove_diacritics( (file.originalname.split("."))[0] ));
            var file_original_name = file.originalname;
            var file_mime_type = file.mimetype;
            var file_store_name = file.filename;
            var file_size = file.size;
            var file_ext = file_mime_type.split("/");
            var file_name = random_string.generate({charset:file_name_strip})+"."+file_ext[1];
            req.media_file_name = file_name;

            var file_data = {
                'media_id':'', // after will be filled
                'media_name':file_original_name,
                'media_file_name':file_name,
                'media_file_name_clean':file_name.split(".")[0],
                'media_mime_type':file_mime_type,
                'media_date':date_format(current_date,'dd-mm-yyyy'),
            };
            // get increment e5ojs_media
            e5ojs_get_next_id('media',function(data){
                var next_id = data.seq;
                file_data.media_id = next_id;
                // save on DB
                //console.log(file_data);
                e5ojs_insert_new_media(file_data,function(result_data){
                    // validate error
                    result_data.media_file_name = e5ojs_global_data.admin_res.media_uploads_url+result_data.media_file_name;
                    // get image data and send as part of req and get it on router function
                    req.e5ojs_file_validation_error = false;
                    req.e5ojs_file_data = result_data; // pass data to request
                    return cb(null, true);// save file
                });
            });
        }
    }
}).any();
/* end filter upload files */
/* ============== start e5ojs global var ============== */














/* ============== start e5ojs configuration ============== */

function e5ojs_init(callback) {
    // load all post types
    e5ojs_global_data.admin_pages.admin_post_types = new Array();
    e5ojs_post_type_get_all(function(post_types){
        // fix post type info
        for( var post_type_key in post_types ) {
            var post_type = post_types[post_type_key];
            e5ojs_global_data.admin_pages.admin_post_types[post_type.post_type_name] = {post_type_id:post_type.post_type_id,title:post_type.post_type_title,description:post_type.post_type_description,url:e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type.post_type_name+"/", icon_name:"insert_drive_file"};
        }
        // set router for each post type
        for( var key in post_types ) {
            var post_type = post_types[key];
            e5ojs_add_post_type_router(post_type);
        }
        callback();
    });
}

function e5ojs_global_data_init() {

    //  three sections
    e5ojs_global_data.admin_pages = {
        dashboard: {title:"dashboard",description:"Lorem ipsum...",url:host_url+"/admin/", icon_name:"dashboard", position:1, show_menu: 1},
        pages: {title:"pages",description:"Lorem ipsum...",url:host_url+"/admin/page/", icon_name:"filter_none", position:2, show_menu: 1},
        admin_post_types: {},
        media: {title:"media",description:"Lorem ipsum...",url:host_url+"/admin/media/", icon_name:"collections", position:3, show_menu: 1},
        post_type: {title:"post types",description:"Lorem ipsum...",url:host_url+"/admin/post-types/", icon_name:"settings", position:4, show_menu: 1},
        users: {title:"users",description:"Lorem ipsum...",url:host_url+"/admin/users/", icon_name:"supervisor_account", position:5, show_menu: 1},
        settings: {title:"settings",description:"Lorem ipsum...",url:host_url+"/admin/settings/", icon_name:"settings", position:6, show_menu: 1},
        search: {title:"search",description:"Lorem ipsum...",url:host_url+"/admin/search/", icon_name:"search", position:7, show_menu: 0},
    };
    e5ojs_global_data.current_page_key = "dashboard";
    e5ojs_global_data.current_post_type_key = "";
    e5ojs_global_data.admin_sub_pages = {
        pages: [{title:"All",url:host_url+"/admin/page/all/page/1/"},{title:"publish",url:host_url+"/admin/page/publish/page/1/"},{title:"Pending",url:host_url+"/admin/page/pending/page/1/"},{title:"Trash",url:host_url+"/admin/page/trash/page/1/"},{title:'New',url:host_url+"/admin/page/action/new/"}],
        post_type: [{title:"All",url:host_url+"/admin/post-types/all/page/1/"},{title:"Active",url:host_url+"/admin/post-types/active/page/1/"},{title:"Deactive",url:host_url+"/admin/post-types/deactive/page/1/"},{title:'New',url:host_url+"/admin/post-types/action/new/"}],
        users: [{title:"All",url:host_url+"/admin/users/all/page/1/"},{title:"Active",url:host_url+"/admin/users/active/page/1/"},{title:"Deactive",url:host_url+"/admin/users/deactive/page/1/"},{title:'New',url:host_url+"/admin/users/action/new/"}],
    };
    e5ojs_global_data.admin_post_type_sub_pages = [{title:"All",url:"all/page/1/"},{title:"publish",url:"publish/page/1/"},{title:"Pending",url:"pending/page/1/"},{title:"Trash",url:"trash/page/1/"},{title:'New',url:"action/new/"}];
    e5ojs_global_data.admin_other_pages = {
        login: {title:"Login",description:"Lorem ipsum...",url:host_url+"/admin/login/", icon_name:"dashboard",position:1},
        new_post: {title:"New post",description:"Lorem ipsum...",url:host_url+"/admin/", icon_name:"dashboard",position:1},
        edit_post: {title:"Edit post",description:"Lorem ipsum...",url:host_url+"/admin/", icon_name:"dashboard",position:1},
        new_post_type: {title:"New post type",description:"Lorem ipsum...",url:host_url+"/admin/", icon_name:"dashboard",position:1},
        edit_post_type: {title:"Edit post type",description:"Lorem ipsum...",url:host_url+"/admin/", icon_name:"dashboard",position:1},
        new_user: {title:"New user",description:"Lorem ipsum...",url:host_url+"/admin/", icon_name:"supervisor_account",position:1},
        edit_user: {title:"Edit user",description:"Lorem ipsum...",url:host_url+"/admin/", icon_name:"supervisor_account",position:1},
    };
    e5ojs_global_data.admin_actions = {
        page: {
            action: 'action/',
            new: 'action/new/',
            edit: 'action/edit/',
            delete: 'action/delete/',
            pagination_all: 'all/page/',
            pagination_publish: 'publish/page/',
            pagintaion_pending: 'pending/page/',
            pagination_trash: 'trash/page/',
        },
        post_types: {
            action: 'action/',
            new: 'action/new/',
            edit: 'action/edit/',
            delete: 'action/delete/',
            pagination_all: 'all/page/',
            pagination_active: 'active/page/',
            pagination_deactive: 'deactive/page/',
        },
        post_type: {
            action: 'action/',
            new: 'action/new/',
            edit: 'action/edit/',
            trash: 'action/trash/',
            delete: 'action/delete/',
            pagination_all: 'all/page/',
            pagination_publish: 'publish/page/',
            pagintaion_pending: 'pending/page/',
            pagination_trash: 'trash/page/',
        },
        users: {
            action: 'action/',
            new: 'action/new/',
            edit: 'action/edit/',
            delete: 'action/delete/',
            pagination_all: 'all/page/',
            pagination_active: 'active/page/',
            pagination_deactive: 'deactive/page/',
        }
    };
    e5ojs_global_data.admin_res = {
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
        e5ojs_media_api: host_url+'/admin/e5ojs-media-api/page/',
    };

    // fill e5ojs_global_data with settings data
    // get current settings
    e5ojs_refresh_admin_pages_data(function(){
        // get post types
        e5ojs_init(function(){});
    });
}
function e5ojs_refresh_admin_pages_data(callback) {
    // fill e5ojs_global_data with settings data
    // get current settings
    e5ojs_settings_get_all(function(current_settings){
        var settings_admin_pages_data = {};
        for( settings_key in current_settings ) {
            if( current_settings[settings_key].settings_id == "settings_admin_pages_data" ) {
                settings_admin_pages_data = current_settings[settings_key].settings_value;
                break;
            }
        }

        for( page_data_key in settings_admin_pages_data ) {
            if( page_data_key == "settings_dashboard_page_title" ) {
                e5ojs_global_data.admin_pages.dashboard.title = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_dashboard_page_description" ) {
                e5ojs_global_data.admin_pages.dashboard.description = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_pages_page_title" ) {
                e5ojs_global_data.admin_pages.pages.title = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_pages_page_description" ) {
                e5ojs_global_data.admin_pages.pages.description = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_media_page_title" ) {
                e5ojs_global_data.admin_pages.media.title = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_media_page_description" ) {
                e5ojs_global_data.admin_pages.media.description = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_post_type_page_title" ) {
                e5ojs_global_data.admin_pages.post_type.title = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_post_type_page_description" ) {
                e5ojs_global_data.admin_pages.post_type.description = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_users_page_title" ) {
                e5ojs_global_data.admin_pages.users.title = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_users_page_description" ) {
                e5ojs_global_data.admin_pages.users.description = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_search_page_title" ) {
                e5ojs_global_data.admin_pages.search.title = settings_admin_pages_data[page_data_key];
            }
            if( page_data_key == "settings_search_page_description" ) {
                e5ojs_global_data.admin_pages.search.description = settings_admin_pages_data[page_data_key];
            }


        }
        callback();
        // get post types
        //e5ojs_init(function(){});
    });
}
e5ojs_global_data_init();

/* ============== end e5ojs configuration ============== */





















/* ============== start e5ojs router ============== */


/* start get current page request */
router.get('*', function(req, res, next) {
    //console.log( " === REQUEST PAGE === ", req.originalUrl );
    var original_url = req.originalUrl;
    var element_page_key = "dashboard";
    e5ojs_global_data.current_post_type_key = "";
    for( admin_page_key in e5ojs_global_data.admin_pages ) {
        var admin_page = e5ojs_global_data.admin_pages[admin_page_key];
        var admin_page_url = admin_page.url;
        admin_page = admin_page.url;
        if( admin_page !== undefined ) {
            admin_page = admin_page.replace("http://nodejs.dev/admin","");
            if( original_url.indexOf(admin_page) >= 0 && admin_page.length > 1) {
                element_page_key = admin_page_key;
            }
        }
        // check for post type
        if( admin_page_key == "admin_post_types" ) {
            var post_type_elements = e5ojs_global_data.admin_pages[admin_page_key];
            for( post_type_key in post_type_elements ) {

                admin_page = post_type_elements[post_type_key].url;
                //console.log("POST TYPE NAME = "+admin_page);
                if( admin_page !== undefined ) {
                    admin_page = admin_page.replace("http://nodejs.dev/admin","");
                    if( original_url.indexOf(admin_page) >= 0 && admin_page.length > 1) {
                        element_page_key = admin_page_key;
                        // get post type key
                        e5ojs_global_data.current_post_type_key = admin_page.split("/")[2]; // /post-type/blogcito/
                    }
                }
            }
        }
    }
    e5ojs_global_data.current_page_key = element_page_key;
    //console.log(" == admin_page_key == ",element_page_key);
    next();
});
router.post('*', function(req, res, next) {
    //console.log( " === REQUEST PAGE === ", req.originalUrl );
    var original_url = req.originalUrl;
    var element_page_key = "dashboard";
    e5ojs_global_data.current_post_type_key = "";
    for( admin_page_key in e5ojs_global_data.admin_pages ) {
        var admin_page = e5ojs_global_data.admin_pages[admin_page_key];
        var admin_page_url = admin_page.url;
        admin_page = admin_page.url;
        if( admin_page !== undefined ) {
            admin_page = admin_page.replace("http://nodejs.dev/admin","");
            if( original_url.indexOf(admin_page) >= 0 && admin_page.length > 1) {
                element_page_key = admin_page_key;
            }
        }
        // check for post type
        if( admin_page_key == "admin_post_types" ) {
            var post_type_elements = e5ojs_global_data.admin_pages[admin_page_key];
            for( post_type_key in post_type_elements ) {

                admin_page = post_type_elements[post_type_key].url;
                //console.log("POST TYPE NAME = "+admin_page);
                if( admin_page !== undefined ) {
                    admin_page = admin_page.replace("http://nodejs.dev/admin","");
                    if( original_url.indexOf(admin_page) >= 0 && admin_page.length > 1) {
                        element_page_key = admin_page_key;
                        // get post type key
                        e5ojs_global_data.current_post_type_key = admin_page.split("/")[2]; // /post-type/blogcito/
                    }
                }
            }
        }
    }
    e5ojs_global_data.current_page_key = element_page_key;
    //console.log(" == admin_page_key == ",element_page_key);
    next();
});
/* end current page request */


/*  start e5ojs login session routers */
router.get('/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin', { page_data: e5ojs_global_data.admin_pages['dashboard'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.post('/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin', { page_data: e5ojs_global_data.admin_pages['dashboard'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.get('/admin/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        //console.log("e5ojs_global_data",e5ojs_global_data);
        res.render('back-end/e5ojs-admin', { page_data: e5ojs_global_data.admin_pages['dashboard'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.get('/log-out/', function(req, res, next) {
    e5ojs_global_data_init();
    // clear session data
    var e5ojs_session = req.session;
    e5ojs_session.e5ojs_user_data = null;
    e5ojs_session.destroy();
    // return log-in page
    res.render('back-end/e5ojs-login', { page_data: e5ojs_global_data.admin_other_pages['login'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:null });
});
/*  end e5ojs login session routers */










/*  start e5ojs media upload routers */
router.post('/upload/', function(req, res, next) {
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        //res.render('back-end/e5ojs-admin-new-post', { title: 'NEW POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
        // process image
        upload(req, res, function(err) {
            if( req.e5ojs_file_validation_error ) {
                // remove var req
                delete req.e5ojs_file_validation_error;
                delete req.e5ojs_file_data;
                res.json({"upload":false});
            } else {
                var e5ojs_file_data = req.e5ojs_file_data;
                delete req.e5ojs_file_validation_error;
                delete req.e5ojs_file_data;
                // generate image sizes
                e5ojs_generate_image_file(e5ojs_file_data,function(err){
                    if( err ) {
                        e5ojs_sizes_return = new Array();
                        res.json({"upload":false});
                    } else {
                        e5ojs_file_data.sizes = e5ojs_sizes_return;
                        e5ojs_sizes_return = new Array();
                        res.json({"upload":true,"e5ojs_file_data":e5ojs_file_data});
                    }
                });
            }
        });
    });
});
// get all media return json
router.get('/all-media/',function(req, res, next){
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        //res.render('back-end/e5ojs-admin-new-post', { title: 'NEW POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
        e5ojs_get_all_media(function(media_data){
            if( media_data != false ) {
                var media_sizes = {};
                e5ojs_image_sizes.forEach(function(size,key){
                    var size_key = size.width+"x"+size.height;
                    media_sizes[size_key] = size_key;
                });
                res.json( new Array({status:true,media_posts:media_data,sizes:media_sizes}) );
            } else {
                res.json( new Array({status:false}) );
            }
        });
    });
});
// get all media return json
router.get('/all-media/:media_id',function(req, res, next){
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        var media_id = req.params.media_id;
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        e5ojs_get_media(media_id,function(media_data){
            if( media_data != false ) {
                var media_sizes = {};
                e5ojs_image_sizes.forEach(function(size,key){
                    var size_key = size.width+"x"+size.height;
                    media_sizes[size_key] = size_key;
                });
                res.json( new Array({status:true,media_posts:media_data,sizes:media_sizes}) );
            } else {
                res.json( new Array({status:false}) );
            }
        });
    });
});
/*  end e5ojs media upload routers */











/* start e5ojs post type routers */
function e5ojs_add_post_type_router(post_type_data) {
    // start routers
    router.get('/post-type/'+post_type_data.post_type_name+'/', function(req, res, next) {
        // redirect to post/all
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type_data.post_type_name+"/all/page/1/");
        });
    });
    router.get('/post-type/'+post_type_data.post_type_name+'/:post_status/page/:page/', function(req, res, next) {
        /*
        get all posts with post status and paginated
        */

        // get page with validate session
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // get post type info
            var post_type_info = e5ojs_global_data.admin_pages.admin_post_types[e5ojs_global_data.e5ojs_current_post_type];
            var post_post_type_id = post_type_info.post_type_id;
            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default
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
            db.e5ojs_post.find({'post_status':{$in:post_status_array},'post_post_type_id':post_post_type_id}).count(function(q_req, q_res, q_next){
                total_post = parseInt(q_res);
                total_pages = parseInt(total_post/limit_post);
                total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+parseInt(total_post%limit_post));
            });
            // query with skip page
            db.e5ojs_post.find({'post_status':{$in:post_status_array},'post_post_type_id':post_post_type_id}).sort({'post_date':-1,'post_id':-1}).skip(skip_posts).limit(limit_post, function(err, posts){
                // get pagination
                var e5ojs_pagination = e5ojs_get_pagination(total_pages,current_page,total_post,base_url=post_type_info.url+post_status+"/");
                // check if has message session
                // get session message
                var e5ojs_message = e5ojs_get_session_message(req);
                // remove session message
                e5ojs_clear_session_message(req);
                // validate error
                res.render('back-end/e5ojs-admin-posts', { page_data: {title:post_type_info.title,description: post_type_info.description}, e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:posts, e5ojs_pagination:e5ojs_pagination, e5ojs_message:e5ojs_message, post_status:post_status });
                //res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.result_data, result_query_db:1, result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, post_status:post_status });
            });
        });
    });
    router.get('/post-type/'+post_type_data.post_type_name+'/action/new/', function(req, res, next) {
        /*
        get template for add new post
        */
        // get page with validate session
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default
            res.render('back-end/e5ojs-admin-new-post', { page_data: e5ojs_global_data.admin_other_pages['new_post'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
        });
    });
    router.get('/post-type/'+post_type_data.post_type_name+'/action/edit/:post_id/', function(req, res, next) {
        /*
        get template with post data it will be edited
        */
        // get post data to show and edit
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // get post type data

            e5ojs_post_type_get_by_name(e5ojs_global_data.e5ojs_current_post_type,function(post_type_data){
                var post_type_meta = [];
                if( post_type_data != null) {
                    post_type_meta = post_type_data[0].post_type_meta;
                }
                // return template with user data
                // e5ojs_global_data  and e5ojs_user_data default

                // show post data
                var post_id = req.params.post_id; // get url parm post_id

                // get post meta
                e5ojs_get_post_meta(post_id,function(current_post_meta){
                    //console.log("current_post_meta_saved",current_post_meta_saved);
                    // math metas
                    // remove meta saved diffrerent to post type meta name
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

                    // get post data with id
                    e5ojs_get_post(post_id,function(post_data){
                        // validate error

                        // check if has message session
                        // get session message
                        var e5ojs_message = e5ojs_get_session_message(req);
                        // remove session message
                        e5ojs_clear_session_message(req);
                        var post_data_object = post_data[0];
                        // add post_type_meta to post_data
                        post_data_object.post_type_meta = post_meta_data;
                        // validate post_media_attachment
                        if( post_data_object.post_media_attachment.length ) {
                            // get image from DB
                            e5ojs_get_media(post_data_object.post_media_attachment,function(media_result){
                                if( media_result == false ) {
                                    post_data_object.post_media_attachment_id = "";
                                    post_data_object.post_media_attachment_url = e5ojs_global_data.admin_res.media_default_image_url;
                                } else {
                                    var media_url = e5ojs_global_data.admin_res.media_uploads_sizes_url+media_result[0].media_file_name_clean+"-800x200."+(media_result[0].media_mime_type.split("/"))[1];
                                    post_data_object.post_media_attachment_id = media_result[0].media_id;
                                    post_data_object.post_media_attachment_url = media_url;
                                }
                                // render with post data
                                res.render('back-end/e5ojs-admin-edit-post', { page_data: e5ojs_global_data.admin_other_pages['edit_post'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:post_data_object, e5ojs_message:e5ojs_message });
                            });
                        } else {
                            // no media id
                            post_data_object.post_media_attachment_id = "";
                            post_data_object.post_media_attachment_url = e5ojs_global_data.admin_res.media_default_image_url;
                            // render with post data
                            res.render('back-end/e5ojs-admin-edit-post', { page_data: e5ojs_global_data.admin_other_pages['edit_post'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:post_data_object, e5ojs_message:e5ojs_message });
                        }
                    });
                });


            });

        });

    });
    router.post('/post-type/'+post_type_data.post_type_name+'/action/edit/:post_id/:post_status/', function(req, res, next) {
        /*
        update post data with post id and post status passed by URL
        */
        // update post data
        // get page with validate session
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // get post type info
            var post_type_info = e5ojs_global_data.admin_pages.admin_post_types[e5ojs_global_data.e5ojs_current_post_type];
            var post_post_type_id = post_type_info.post_type_id;
            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default

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
            var post_media_attachment = req.body.post_media_id;
            //var post_post_type_id = post_post_type_id;

            // update post on DB
            // generate post name
            var post_name = post_title.replace(/\s+/g, '-').toLowerCase();
            //var post_name = getSlug(remove_diacritics(e5ojs_global_data.e5ojs_current_post_type))+"/"+getSlug(remove_diacritics(post_name));
            var post_name = getSlug(remove_diacritics(post_name));

            // check for post meta
            var post_meta = [];
            for( element_key in req.body ) {
                var index_position = element_key.indexOf("meta_");
                if( index_position != -1 ) {
                    if( index_position == 0 ) {
                        //console.log("META : "+element_key,req.body[element_key]);
                        post_meta.push( {post_meta_id:'',post_meta_post_id:parseInt(post_id),post_meta_name:element_key,post_meta_value:req.body[element_key]} );
                    }
                }
            }

            var post_meta_save = [];
            // get post type metas
            e5ojs_post_type_get_by_id(post_post_type_id,function(post_type_data_result){
                if( post_type_data_result != null ) {
                    var post_type_meta = post_type_data_result[0].post_type_meta;
                    if( post_type_meta.length ) {
                        if( post_type_meta.length ) {
                            // the post meta has metas
                            // math request meta and post type meta
                            for( meta_key in post_type_meta ) {
                                var meta_name = post_type_meta[meta_key].meta_name;
                                // search meta_name on post_meta
                                for( post_meta_key in post_meta ) {
                                    if( post_meta[post_meta_key].post_meta_name.indexOf(meta_name) > 0 ) {
                                        post_meta_save.push( {post_meta_id:'',post_meta_post_id:post_meta[post_meta_key].post_meta_post_id,post_meta_name:post_meta[post_meta_key].post_meta_name,post_meta_value:post_meta[post_meta_key].post_meta_value} );
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                var post_meta_update = [];
                // get current post meta from this posts and to do math with request meta to save
                e5ojs_get_post_meta(post_id,function(current_post_meta_saved){
                    if( current_post_meta_saved != null && current_post_meta_saved.length > 0 ) {
                        // math post metas
                        // current meta
                        for( current_meta_key in current_post_meta_saved ) {
                            current_meta = current_post_meta_saved[current_meta_key];
                            // meta save
                            for( meta_save_key in post_meta_save ) {
                                meta_save = post_meta_save[meta_save_key];
                                // compare meta names
                                if( current_meta.post_meta_name == meta_save.post_meta_name ) {
                                    // copy data
                                    current_meta.post_meta_value = meta_save.post_meta_value;
                                    //delete post_meta_save[meta_save_key];
                                    post_meta_save.splice(meta_save_key, 1);
                                    post_meta_update.push(current_meta);
                                }
                            }
                        }
                        //return false;
                    }
                    //console.log("post_meta_save",post_meta_save);
                    //console.log("post_meta_update",post_meta_update);

                    // update post metas
                    e5ojs_update_post_meta(post_meta_update,function(update_post_meta_result){
                        //console.log("update_post_meta_result",update_post_meta_result);
                        // insert post meta on DB
                        e5ojs_insert_post_meta(post_meta_save,function(insert_post_meta_result){
                            //console.log("insert_post_meta_result",insert_post_meta_result);
                            // update post
                            e5ojs_update_post( {post_id:parseInt(post_id),post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_media_attachment:post_media_attachment,post_status:post_status,post_post_type_id:post_post_type_id},function(result_data){
                                // validate result
                                // create session message
                                var e5ojs_message = null;
                                // show notification
                                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post edited'};
                                // save message on session var
                                e5ojs_push_session_message(req,e5ojs_message);
                                // set true for front-end refresh routers
                                req.app.locals.e5ojs_refresh_router = true;
                                // redirect to edit post with ID
                                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type_data.post_type_name+"/action/edit/"+result_data.post_id);
                            });
                        });
                    });
                });
            });
        });
    });
    router.post('/post-type/'+post_type_data.post_type_name+'/action/new/:post_status', function(req, res, next) {
        /*
        insert a new post with post status passed by URL
        */
        // get page with validate session
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // get post type info
            var post_type_info = e5ojs_global_data.admin_pages.admin_post_types[e5ojs_global_data.e5ojs_current_post_type];
            var post_post_type_id = post_type_info.post_type_id;

            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default
            //res.render('back-end/e5ojs-admin-new-post', { title: 'NEW POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });

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
            var post_media_attachment = req.body.post_media_id;

            // save new post on DB
            //db.e5ojs_post.insert({post_id:});
            e5ojs_get_next_id('post',function(data){
                var next_id = data.seq;
                // insert post data
                var post_name = post_title.replace(/\s+/g, '-').toLowerCase();
                //var post_name = getSlug(remove_diacritics(e5ojs_global_data.e5ojs_current_post_type))+"/"+getSlug(remove_diacritics(post_name));
                var post_name = getSlug(remove_diacritics(post_name));
                e5ojs_insert_new_post({post_id:next_id,post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_media_attachment:post_media_attachment,post_status:post_status,post_post_type_id:post_post_type_id},function(result_data){
                    // validate result
                    // create session message
                    var e5ojs_message = null;
                    // show notification
                    e5ojs_message = {'status':1,'type':'done','text':'Successfully - New post created'};
                    // save message on session var
                    e5ojs_push_session_message(req,e5ojs_message);
                    // redirect to edit post with ID
                    res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type_data.post_type_name+"/action/edit/"+result_data.post_id);
                });
            });
        });
    });
    router.get('/post-type/'+post_type_data.post_type_name+'/action/:post_status/:post_id/', function(req, res, next) {
        /*
        update one choose post status from multiple posts ids
        only change post status passed from url example: post_status/post_id
        http://nodejs.dev/admin/posts/action/delete/79
        */

        // change post status to dynamically
        // get page with validate session
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default
            // get action
            var request_action = req.params.post_status;
            // get post id param
            var post_id = req.params.post_id; // get url parm post_id
            // check if has multiples ids
            var post_ids = post_id.split(",");

            // validate post status
            var post_set_status = "pending";
            if( request_action == "publish" ) {
                post_set_status = "publish";
            } else if( request_action == "pending" ) {
                post_set_status = "pending";
            } else if( request_action == "trash" ) {
                post_set_status = "trash";
            } else if( request_action == "delete" ) {
                // delete document db
                post_set_status = "delete";
            }
            if( post_set_status == "delete" ) {
                // delete forever
                e5ojs_delete_post_status_multiple(post_ids,function(data){
                    // create session message
                    // validate result
                    var e5ojs_message = null;
                    if( data.status ) {
                        // show notification
                        e5ojs_message = {'status':1,'type':'done','text':'Successfully - '+post_set_status};
                    } else {
                        e5ojs_message = {'status':1,'type':'error','text':'Error - Tried to '+post_set_status};
                    }
                    // save message on session var
                    e5ojs_push_session_message(req,e5ojs_message);
                    // redirect to posts archive
                    res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type_data.post_type_name+"/all/page/1/");
                });
            } else {
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
                    res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type_data.post_type_name+"/all/page/1/");
                });
            }

        });
    });
}
/*  end e5ojs post type routers  */













/* start e5ojs pages routers */
router.get('/page/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/all/page/1/");
    });
});
router.get('/page/:page_status/page/:number_page/', function(req, res, next) {


    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        // get all pages paginated
        // get post status
        // get post status
        var post_status = req.params.page_status;
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

        // get posts
        // get total pages
        var limit_post = 12;
        var skip_posts = 0;
        var total_post = 0;
        if( parseInt(req.params.number_page) == 1 ) {
            skip_posts = 0;
        } else {
            skip_posts = (parseInt(req.params.number_page)-1)*limit_post;
        }
        var total_pages = 0;
        var current_page = req.params.number_page;

        // total pages
        db.e5ojs_page.find({'page_status':{$in:post_status_array}}).sort({'post_page_id':-1}).count(function(q_req, q_res, q_next){
            total_post = parseInt(q_res);
            total_pages = parseInt(total_post/limit_post);
            total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+parseInt(total_post%limit_post));
        });
        // query with skip page
        db.e5ojs_page.find({'page_status':{$in:post_status_array}}).sort({'post_type_id':-1}).skip(skip_posts).limit(limit_post, function(err, pages_data){
            // get pagination
            var e5ojs_pagination = e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.admin_pages['pages'].url+post_status+"/");
            // get session message
            var e5ojs_message = e5ojs_get_session_message(req);
            // remove session message
            e5ojs_clear_session_message(req);
            // render post type page
            res.render('back-end/e5ojs-admin-pages', { page_data: e5ojs_global_data.admin_pages['pages'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, pages_data:pages_data, e5ojs_pagination:e5ojs_pagination, page_status:post_status });
        });

    });
});
router.get('/page/action/new/', function(req, res, next) {
    // return the template to add new page
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        e5ojs_read_template_files_json(function(templates_json){
            // check if has message session
            // get session message
            var e5ojs_message = e5ojs_get_session_message(req);
            // remove session message
            e5ojs_clear_session_message(req);
            res.render('back-end/e5ojs-admin-page', { page_data: e5ojs_global_data.admin_pages['pages'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], pages_data:null, e5ojs_message:e5ojs_message, e5ojs_templates_json:templates_json });
        });
    });
});
router.post('/page/action/edit/:page_status/', function(req, res, next) {
    // save the new page and redirect to edit/:page_id
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default

        // get post data
        var page_status = req.params.page_status;
        var page_media_id = req.body.page_media_id;
        var page_title = req.body.page_title;
        var page_content = req.body.page_content;
        var page_excerpt = req.body.page_excerpt;
        var page_date = req.body.page_date;
        var page_template = req.body.page_template;

        var page_data = {
            page_id: '',
            page_title: page_title,
            page_content: page_content,
            page_excerpt: page_excerpt,
            page_date: page_date,
            page_status: page_status,
            page_media_id: page_media_id,
            page_template: page_template
        }
        // insert new post and redirect with id returned
        e5ojs_page_insert_new(page_data,function(page_data_result){

            var e5ojs_message = null;
            if( page_data_result != null ) {
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'New page created.'};
            } else {
                e5ojs_message = {'status':1,'type':'error','text':'The page was not created.'};
            }
            // save message on session var
            e5ojs_push_session_message(req,e5ojs_message);
            // set true for front-end refresh routers
            req.app.locals.e5ojs_refresh_router = true;
            // response
            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/action/edit/"+page_data_result.page_id+"/");
        });
    });
});
router.get('/page/action/edit/:page_id/', function(req, res, next) {
    // return the page data to edit
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default
            // get page id
            var page_id = req.params.page_id;


            // get page metas to match
            e5ojs_settings_get_all(function(current_settings){
                // page metas
                var post_type_meta = [];
                for( settings_key in current_settings ) {
                    if( current_settings[settings_key].settings_id == "settings_page_metas" ) {
                        post_type_meta = current_settings[settings_key].settings_value;
                        break;
                    }
                }

                // get post meta
                e5ojs_get_post_meta(page_id,function(current_post_meta){
                    //console.log("current_post_meta",current_post_meta);
                    // math metas
                    // remove meta saved diffrerent to post type meta name
                    var post_meta_data = [];
                    for( key_meta in post_type_meta ) {
                        var find = 0;
                        for( key_current_meta in current_post_meta ) {
                            //- console.log("meta - ",post_type_meta[key_meta]);
                            if( "meta_"+post_type_meta[key_meta].page_meta_name == current_post_meta[key_current_meta].post_meta_name ) {
                                current_post_meta[key_current_meta].meta_page_id = post_type_meta[key_meta].page_meta_page_id;
                                current_post_meta[key_current_meta].meta_name = post_type_meta[key_meta].page_meta_name;
                                current_post_meta[key_current_meta].meta_type = post_type_meta[key_meta].page_meta_type;
                                current_post_meta[key_current_meta].meta_title = post_type_meta[key_meta].page_meta_title;
                                post_meta_data.push(current_post_meta[key_current_meta]);
                                find = 1;
                            }
                        }
                        if( find == 0 ) {
                            // add meta data
                            post_meta_data.push({meta_page_id:post_type_meta[key_meta].page_meta_page_id,meta_title:post_type_meta[key_meta].page_meta_title,meta_type:post_type_meta[key_meta].page_meta_type,meta_name:post_type_meta[key_meta].page_meta_name,post_meta_value:""});
                        }
                    }


                    // get page with the ID and return data
                    e5ojs_page_get_page(page_id,function(page_data){
                        if( page_data == null ) {
                            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/action/new/");
                        } else {
                            // get image from DB
                            e5ojs_get_media(page_data[0].page_media_id,function(media_result){
                                if( media_result == false ) {
                                    page_data[0].post_media_attachment_id = "";
                                    page_data[0].post_media_attachment_url = e5ojs_global_data.admin_res.media_default_image_url;
                                } else {
                                    var media_url = e5ojs_global_data.admin_res.media_uploads_sizes_url+media_result[0].media_file_name_clean+"-800x200."+(media_result[0].media_mime_type.split("/"))[1];
                                    page_data[0].post_media_attachment_id = media_result[0].media_id;
                                    page_data[0].post_media_attachment_url = media_url;
                                }
                                // embed page metas

                                page_data[0].settings_page_metas = post_meta_data;
                                // check if has message session
                                // get session message
                                var e5ojs_message = e5ojs_get_session_message(req);
                                // remove session message
                                e5ojs_clear_session_message(req);
                                // get templates json file
                                e5ojs_read_template_files_json(function(templates_json){
                                    res.render('back-end/e5ojs-admin-page', { page_data: e5ojs_global_data.admin_pages['pages'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, pages_data:page_data, e5ojs_templates_json:templates_json });
                                });
                            });
                        }
                    });
                });
            });
    });
});
router.post('/page/action/edit/:page_id/:page_status/',function(req, res, next){
    // update page data
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // get page id
        var page_id = req.params.page_id;
        // get post data
        var page_status = req.params.page_status;
        var page_media_id = req.body.page_media_id;
        var page_title = req.body.page_title;
        var page_content = req.body.page_content;
        var page_excerpt = req.body.page_excerpt;
        var page_date = req.body.page_date;
        var page_template = req.body.page_template;

        var page_data = {
            page_id: page_id,
            page_title: page_title,
            page_content: page_content,
            page_excerpt: page_excerpt,
            page_date: page_date,
            page_status: page_status,
            page_media_id: page_media_id,
            page_template: page_template
        }





        // check for page meta
        var post_meta = [];
        for( element_key in req.body ) {
            var index_position = element_key.indexOf("meta_");
            if( index_position != -1 ) {
                if( index_position == 0 ) {
                    //console.log("META : "+element_key,req.body[element_key]);
                    post_meta.push( {post_meta_id:'',post_meta_post_id:parseInt(page_id),post_meta_name:element_key,post_meta_value:req.body[element_key]} );
                }
            }
        }
        var post_meta_save = [];
        //console.log(" === post_meta adriana === ",post_meta);


        // get page metas to match
        e5ojs_settings_get_all(function(current_settings){
            // get page metas
            var post_type_meta = {};
            for( settings_key in current_settings ) {
                if( current_settings[settings_key].settings_id == "settings_page_metas" ) {
                    post_type_meta = current_settings[settings_key].settings_value;
                    break;
                }
            }

            // the post meta has metas
            // math request meta and post type meta
            for( meta_key in post_type_meta ) {
                var meta_name = post_type_meta[meta_key].page_meta_name;
                // search meta_name on post_meta
                for( post_meta_key in post_meta ) {
                    if( post_meta[post_meta_key].post_meta_name.indexOf(meta_name) > 0 ) {
                        post_meta_save.push( {post_meta_id:'',post_meta_post_id:post_meta[post_meta_key].post_meta_post_id,post_meta_name:post_meta[post_meta_key].post_meta_name,post_meta_value:post_meta[post_meta_key].post_meta_value} );
                        break;
                    }
                }
            }
            //console.log(" === post_meta_save adriana === ",post_meta_save);

            var post_meta_update = [];
            // get current post meta from this posts and to do math with request meta to save
            e5ojs_get_post_meta(page_id,function(current_post_meta_saved){
                if( current_post_meta_saved != null && current_post_meta_saved.length > 0 ) {
                    // math post metas
                    // current meta
                    for( current_meta_key in current_post_meta_saved ) {
                        current_meta = current_post_meta_saved[current_meta_key];
                        // meta save
                        for( meta_save_key in post_meta_save ) {
                            meta_save = post_meta_save[meta_save_key];
                            // compare meta names
                            if( current_meta.post_meta_name == meta_save.post_meta_name ) {
                                // copy data
                                current_meta.post_meta_value = meta_save.post_meta_value;
                                //delete post_meta_save[meta_save_key];
                                post_meta_save.splice(meta_save_key, 1);
                                post_meta_update.push(current_meta);
                            }
                        }
                    }
                    //return false;
                }
                //console.log("post_meta_save",post_meta_save);
                //console.log("post_meta_update",post_meta_update);

                //update post metas
                e5ojs_update_post_meta(post_meta_update,function(update_post_meta_result){
                    //console.log("update_post_meta_result",update_post_meta_result);
                    // insert post meta on DB
                    e5ojs_insert_post_meta(post_meta_save,function(insert_post_meta_result){
                        //console.log("insert_post_meta_result",insert_post_meta_result);
                        // update page and redirect with id returned
                        e5ojs_page_update(page_data,function(page_data_result){
                            var e5ojs_message = null;
                            if( page_data_result != null ) {
                                // show notification
                                e5ojs_message = {'status':1,'type':'done','text':'Page updated'};
                            } else {
                                e5ojs_message = {'status':1,'type':'error','text':'Page no updated'};
                            }
                            // save message on session var
                            e5ojs_push_session_message(req,e5ojs_message);
                            // set true for front-end refresh routers
                            req.app.locals.e5ojs_refresh_router = true;
                            // response
                            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/action/edit/"+page_id+"/");
                        });
                    });
                });
            });
        });
    });
});
router.get('/page/action/:page_status/:page_ids/', function(req, res, next) {
    // bulk action page status

    // change post status to dynamically
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        // get action
        var request_action = req.params.page_status;
        // get post id param
        var post_id = req.params.page_ids; // get url parm post_id
        // check if has multiples ids
        var post_ids = post_id.split(",");

        // validate post status
        var post_set_status = "pending";
        if( request_action == "publish" ) {
            post_set_status = "publish";
        } else if( request_action == "pending" ) {
            post_set_status = "pending";
        } else if( request_action == "trash" ) {
            post_set_status = "trash";
        } else if( request_action == "delete" ) {
            // delete document db
            post_set_status = "delete";
        }
        if( post_set_status == "delete" ) {
            // delete forever
            e5ojs_delete_page_status_multiple(post_ids,function(data){
                // create session message
                // validate result
                var e5ojs_message = null;
                if( data.status ) {
                    // show notification
                    e5ojs_message = {'status':1,'type':'done','text':'Successfully - '+post_set_status};
                } else {
                    e5ojs_message = {'status':1,'type':'error','text':'Error - Tried to '+post_set_status};
                }
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                req.app.locals.e5ojs_refresh_router = true;
                // redirect to posts archive
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/all/page/1/");
            });
        } else {
            //console.log("post_set_status : ",post_set_status);
            // multiple post ids
            // update posts
            e5ojs_change_page_status_multiple(post_ids,post_set_status,function(data){ //aqui
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
                // set true for front-end refresh routers
                req.app.locals.e5ojs_refresh_router = true;
                // redirect to posts archive
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/all/page/1/");
            });
        }

    });
});

/* end e5ojs pages routers */















/* start e5ojs post type routers */
router.get('/post-types/action/new/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        e5ojs_post_type_get_all(function(post_types){
            // e5ojs_global_data  and e5ojs_user_data default
            e5ojs_read_template_files_json(function(templates_json){
                // check if has message session
                // get session message
                var e5ojs_message = e5ojs_get_session_message(req);
                // remove session message
                e5ojs_clear_session_message(req);
                // render post type page
                res.render('back-end/e5ojs-admin-post-type-edit', { page_data: e5ojs_global_data.admin_other_pages['new_post_type'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, post_types:post_types, e5ojs_templates_json:templates_json });
            });
        });
    });
});
router.post('/post-types/action/edit/', function(req, res, next) {
    // save the new post type
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        // get page with validate session
        var post_type_action = req.params.post_type_action;
        var post_type_title = req.body.post_type_title;
        var post_type_name = req.body.post_type_name;
        var post_type_description = req.body.post_type_description;
        var post_type_archive_template = req.body.post_type_archive_template;
        var post_type_single_template = req.body.post_type_single_template;
        var post_type_slug = getSlug(remove_diacritics( post_type_name ));
        var post_type_status = ((req.body.post_type_status=="on")?1:0);
        var post_type_meta = [];
        // save new post type
        e5ojs_post_type_insert_new({'post_type_id':'','post_type_title':post_type_title,'post_type_name':post_type_name,'post_type_description':post_type_description,'post_type_slug':post_type_slug,post_type_status:parseInt(post_type_status),post_type_meta:post_type_meta,post_type_archive_template:post_type_archive_template,post_type_single_template:post_type_single_template},function(post_type_data){
            // create session message
            var e5ojs_message = null;
            // show notification
            e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type created'};
            // save message on session var
            e5ojs_push_session_message(req,e5ojs_message);
            // redirect to de same page
            // set true for front-end refresh routers
            req.app.locals.e5ojs_refresh_router = true;
            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/action/edit/"+post_type_data.post_type_id);
        });
    });
});
router.get('/post-types/action/edit/:post_type_id/', function(req, res, next) {
    // get the current post
    var post_type_id = req.params.post_type_id;
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        e5ojs_post_type(post_type_id,function(post_type){
            // e5ojs_global_data  and e5ojs_user_data default
            e5ojs_read_template_files_json(function(templates_json){
                // check if has message session
                // get session message
                var e5ojs_message = e5ojs_get_session_message(req);
                // remove session message
                e5ojs_clear_session_message(req);
                // render post type page
                res.render('back-end/e5ojs-admin-post-type-edit', {  post_type_info:post_type[0] ,page_data: e5ojs_global_data.admin_other_pages['edit_post_type'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, e5ojs_templates_json:templates_json });
            });
        });
    });
});
router.post('/post-types/action/edit/:post_type_id/', function(req, res, next) {
    // save the current post type
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        // get page with validate session
        var post_type_id = req.params.post_type_id.split(",");
        var post_type_action = req.params.post_type_action;
        var post_type_title = req.body.post_type_title;
        var post_type_name = req.body.post_type_name;
        var post_type_description = req.body.post_type_description;
        var post_type_archive_template = req.body.post_type_archive_template;
        var post_type_single_template = req.body.post_type_single_template;
        var post_type_slug = getSlug(remove_diacritics( post_type_name ));
        var post_type_status = ((req.body.post_type_status=="on")?1:0);


        // check for the edited current post metas
        var post_type_current_metas = [];
        if( req.body.update_finish !== undefined ) {
            // each current post meta
            for( var meta_key = 0; meta_key<=parseInt(req.body.update_finish); meta_key++ ) {
                post_type_current_metas.push({
                    meta_title:req.body[meta_key+"_meta_title"],
                    meta_name:req.body[meta_key+"_meta_name"],
                    meta_type:req.body[meta_key+"_meta_type"],
                });
            }
        }
        if( req.body.post_type_meta_name != "" ) {
            var meta_title = req.body.post_type_meta_title;
            var meta_name = req.body.post_type_meta_name;
            var meta_type = req.body.post_type_meta_type;
            // add the new post meta
            post_type_current_metas.push({
                meta_title:meta_title,
                meta_name:meta_name,
                meta_type:meta_type,
            });
        }

        if( post_type_status == 1 || post_type_status == 0 ) {
            // update post type
            e5ojs_post_type_update({'post_type_id':parseInt(post_type_id),'post_type_title':post_type_title,'post_type_name':post_type_name,'post_type_description':post_type_description,'post_type_slug':post_type_slug,post_type_status:parseInt(post_type_status),post_type_meta:post_type_current_metas,post_type_archive_template:post_type_archive_template,post_type_single_template:post_type_single_template},function(post_type_data){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type updated'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                req.app.locals.e5ojs_refresh_router = true;
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/action/edit/"+post_type_id);
            });
        } else {
            // remove post type
            e5ojs_post_type_delete(post_type_id,function(post_type_data){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type deleted'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                req.app.locals.e5ojs_refresh_router = true;
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/");
            });
        }
    });
});
router.get('/post-types/action/:post_type_action/:post_type_id/', function(req, res, next) {
    var post_type_action = req.params.post_type_action;
    var post_type_id = req.params.post_type_id.split(",");
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {

        if( post_type_action == 1 || post_type_action == 0 ) {
            // update post status
            e5ojs_change_post_type_status_multiple(post_type_id,post_type_action,function(result){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type updated'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                req.app.locals.e5ojs_refresh_router = true;
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/all/page/1/");
            });
        } else {
            // remove post types
            e5ojs_remove_post_type_status_multiple(post_type_id,function(result){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type removed'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                req.app.locals.e5ojs_refresh_router = true;
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/all/page/1/");
            });
        }
    });
});
router.get('/post-types/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // redirect to de same page
        res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/all/page/1/");
    });
});
router.get('/post-types/:post_type_status/page/:number_page/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // e5ojs_global_data  and e5ojs_user_data default
        // request for all posts types on DB

        // get post status
        var post_type_status = req.params.post_type_status;
        var post_status_array = Array();
        if( post_type_status == "all" ) {
            post_status_array = Array(1,0);
        } else {
            if( post_type_status == "active" )
                post_status_array.push(1);
            if( post_type_status == "deactive" )
                post_status_array.push(0);
        }
        // get posts
        var limit_post = 12;
        var skip_posts = 0;
        if( parseInt(req.params.number_page) == 1 ) {
            skip_posts = 0;
        } else {
            skip_posts = (parseInt(req.params.number_page)-1)*limit_post;
        }
        var total_pages = 0;
        var current_page = req.params.number_page;
        var total_post = 0;

        // total pages
        db.e5ojs_post_type.find({'post_type_status':{$in:post_status_array}}).sort({'post_type_id':-1}).count(function(q_req, q_res, q_next){
            total_post = parseInt(q_res);
            total_pages = parseInt(total_post/limit_post);
            total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+parseInt(total_post%limit_post));
        });
        // query with skip page
        db.e5ojs_post_type.find({'post_type_status':{$in:post_status_array}}).sort({'post_type_id':-1}).skip(skip_posts).limit(limit_post, function(err, post_types){
            // get pagination
            var e5ojs_pagination = e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.admin_pages['post_type'].url+post_type_status+"/");
            // get session message
            var e5ojs_message = e5ojs_get_session_message(req);
            // remove session message
            e5ojs_clear_session_message(req);
            // render post type page
            res.render('back-end/e5ojs-admin-post-type', { page_data: e5ojs_global_data.admin_pages['post_type'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, post_types:post_types, e5ojs_pagination:e5ojs_pagination, post_status:post_type_status });
        });
    });
});

/* end e5ojs post type routers */










/* end e5ojs users routers */

router.get('/users/', function(req, res, next) {
    // get page with validate session
    // redirect to post/all
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/all/page/1/");
    });
});
router.get('/users/:user_status/page/:number_page/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // e5ojs_global_data  and e5ojs_user_data default
        // request for all posts types on DB

        // get post status
        var user_status = req.params.user_status;
        var post_status_array = Array();
        if( user_status == "all" ) {
            post_status_array = Array(1,0);
        } else {
            if( user_status == "active" )
                post_status_array.push(1);
            if( user_status == "deactive" )
                post_status_array.push(0);
        }
        // get posts
        var limit_post = 12;
        var skip_posts = 0;
        if( parseInt(req.params.number_page) == 1 ) {
            skip_posts = 0;
        } else {
            skip_posts = (parseInt(req.params.number_page)-1)*limit_post;
        }
        var total_pages = 0;
        var current_page = req.params.number_page;
        var total_post = 0;

        // total pages
        db.e5ojs_user.find({'user_status':{$in:post_status_array}}).sort({'user_id':-1}).count(function(q_req, q_res, q_next){
            total_post = parseInt(q_res);
            total_pages = parseInt(total_post/limit_post);
            total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+parseInt(total_post%limit_post));
        });
        // query with skip page
        db.e5ojs_user.find({'user_status':{$in:post_status_array}}).sort({'user_id':-1}).skip(skip_posts).limit(limit_post, function(err, users_data){
            // get pagination
            var e5ojs_pagination = e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.admin_pages['users'].url+user_status+"/");
            // get session message
            var e5ojs_message = e5ojs_get_session_message(req);
            // remove session message
            e5ojs_clear_session_message(req);
            // render post type page
            res.render('back-end/e5ojs-admin-users', { page_data: e5ojs_global_data.admin_pages['users'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, users_data:users_data, e5ojs_pagination:e5ojs_pagination, post_status:user_status });
        });
    });
});
router.get('/users/action/new/', function(req, res, next) {
    // get page with new user form
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // get session message
        var e5ojs_message = e5ojs_get_session_message(req);
        // remove session message
        e5ojs_clear_session_message(req);
        res.render('back-end/e5ojs-admin-users-edit', { page_data: e5ojs_global_data.admin_pages['users'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], user_info:[], e5ojs_message:e5ojs_message});
    });
});
router.post('/users/action/edit/', function(req, res, next) {
    // save new user and redirect to edit user
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // get user data
        var user_data = {
            user_id: '',
            user_name: req.body.user_name,
            user_last_name: req.body.user_last_name,
            user_bio: req.body.user_bio,
            user_login: req.body.user_login,
            user_pass: md5(req.body.user_pass),
            user_email: req.body.user_email,
            user_avatar_media_id: parseInt( req.body.user_avatar_media_id ),
            user_bkg_media_id: parseInt( req.body.user_bkg_media_id ),
            user_status: parseInt( (( req.body.user_status == 'on')?1:0) ),
            user_date: "",
        };


        // validate user email
        e5ojs_valid_user_email(user_data.user_login,user_data.user_email,function(total_users_find){
            if( total_users_find <= 0 ) {
                // pass
                // get next user id
                e5ojs_get_next_id('users',function(data){
                    // increment post_type counter
                    user_data.user_id = parseInt(data.seq);
                    // insert new user
                    e5ojs_user_insert(user_data, function(result){
                        if( result.error ) {
                            // fail
                            // create session message
                            var e5ojs_message = null;
                            // show notification
                            e5ojs_message = {'status':1,'type':'error','text':'Error - The user has not created, try again.'};
                            // save message on session var
                            e5ojs_push_session_message(req,e5ojs_message);
                            // redirecto to create new user
                            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/action/new/");
                        } else {
                            // done
                            // create session message
                            var e5ojs_message = null;
                            // show notification
                            e5ojs_message = {'status':1,'type':'done','text':'Successfully - User has been created.'};
                            // save message on session var
                            e5ojs_push_session_message(req,e5ojs_message);
                            // redirecto to edit thos new user created
                            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/action/edit/"+result.user_id+"/");
                        }
                    });
                });
                //res.render('back-end/e5ojs-admin-users-edit', { page_data: e5ojs_global_data.admin_pages['users'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], users_data:[]});
            } else {
                // no pass generate notification error

                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'error','text':'Error - Use other user login'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/action/new/");
                //res.render('back-end/e5ojs-admin-users-edit', { page_data: e5ojs_global_data.admin_pages['users'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], users_data:[]});
            }
        });
    });
});
router.get('/users/action/edit/:user_id/', function(req, res, next) {
    // get user with id and return user info with data to edit
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // get user data
        var user_id = req.params.user_id;
        e5ojs_user_get(user_id, function(user_result_data) {
            if( user_result_data.error ) {
                // error at user id
                // generate message and redirect to users
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'error','text':'Error - The user doesn´t exists'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/all/page/1/");
            } else {
                // done
                // get session message
                var e5ojs_message = e5ojs_get_session_message(req);
                // remove session message
                e5ojs_clear_session_message(req);
                // render
                res.render('back-end/e5ojs-admin-users-edit', { page_data: e5ojs_global_data.admin_pages['users'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, user_info:user_result_data.user_data[0]});
            }
        });

    });
});
router.post('/users/action/edit/:user_id/', function(req, res, next) {
    // update user data
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {

        var user_data = {
            user_id: parseInt(req.params.user_id),
            user_name: req.body.user_name,
            user_last_name: req.body.user_last_name,
            user_bio: req.body.user_bio,
            //user_login: req.body.user_login,
            user_pass: md5(req.body.user_pass),
            //user_email: req.body.user_email,
            user_avatar_media_id: parseInt( req.body.user_avatar_media_id ),
            user_bkg_media_id: parseInt( req.body.user_bkg_media_id ),
            user_status: parseInt( (( req.body.user_status == 'on')?1:0) ),
            user_date: "",
        };
        if( req.body.user_pass == "" || req.body.user_pass === 'undefined' ) {
            delete user_data.user_pass;
        }

        // update user data
        e5ojs_user_update(user_data, function(user_result_data) {
            if( user_result_data.error ) {
                // error at user id
                // generate message and redirect to users
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'error','text':'Error - Update error.'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                // redirecto to edit thos new user created
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/action/edit/"+user_data.user_id+"/");
            } else {
                // generate message and redirect to users
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - User has been updated.'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                // redirecto to edit thos new user created
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/action/edit/"+user_data.user_id+"/");
            }
        });

    });
});
router.get('/users/action/:user_action/:user_ids/', function(req, res, next) {
    var user_status_action = req.params.user_action;
    var user_ids = req.params.user_ids.split(",");
    console.log("user_status_action",user_status_action);
    console.log("user_ids",user_ids);
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {

        if( user_status_action == 1 || user_status_action == 0 ) {
            // update post status
            e5ojs_change_user_status_multiple(user_ids,user_status_action,function(result){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Users updated'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/all/page/1/");
            });
        } else {
            // remove post types
            e5ojs_remove_user_status_multiple(user_ids,function(result){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Users removed'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/all/page/1/");
            });
        }
    });
});



/* end e5ojs users routers */








/* end e5ojs settings routers */

router.get('/settings/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // get settings
        e5ojs_settings_get_all(function(result_settings){
            var settings_data = {};
            settings_data.current_settings = {};
            if( result_settings != null )
                settings_data.current_settings = result_settings;
            // get all publish pages for
            e5ojs_page_get_all('publish',function(result_pages){
                settings_data.public_pages = [];
                if( result_pages != null )
                    settings_data.public_pages = result_pages;
                // e5ojs_global_data  and e5ojs_user_data default
                //console.log("settings_data",settings_data);
                res.render('back-end/e5ojs-admin-settings', { page_data: e5ojs_global_data.admin_pages['settings'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], settings_data:settings_data});
            });
        });
    });
});
router.post('/settings/', function(req, res, next) {
    // for save config settings
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // get vars to save
        var settings = [];
        // site settings
        var settings_host_url = req.body.settings_host_url;
        var settings_home_page_template = parseInt(req.body.settings_home_page_template);
        // settings pages
        // for new meta
        var settings_page_meta_post_id = req.body.settings_page_meta_page_id;
        var settings_page_meta_title = req.body.settings_page_meta_title;
        var settings_page_meta_name = req.body.settings_page_meta_name;
        var settings_page_meta_type = req.body.settings_page_meta_type;


        // for admin pages info
        var settings_admin_pages_data = {}
        settings_admin_pages_data.settings_dashboard_page_title = req.body.settings_dashboard_page_title;
        settings_admin_pages_data.settings_dashboard_page_description = req.body.settings_dashboard_page_description;
        settings_admin_pages_data.settings_pages_page_title = req.body.settings_pages_page_title;
        settings_admin_pages_data.settings_pages_page_description = req.body.settings_pages_page_description;
        settings_admin_pages_data.settings_media_page_title = req.body.settings_media_page_title;
        settings_admin_pages_data.settings_media_page_description = req.body.settings_media_page_description;
        settings_admin_pages_data.settings_post_type_page_title = req.body.settings_post_type_page_title;
        settings_admin_pages_data.settings_post_type_page_description = req.body.settings_post_type_page_description;
        settings_admin_pages_data.settings_users_page_title = req.body.settings_users_page_title;
        settings_admin_pages_data.settings_users_page_description = req.body.settings_users_page_description;
        settings_admin_pages_data.settings_search_page_title = req.body.settings_search_page_title;
        settings_admin_pages_data.settings_search_page_description = req.body.settings_search_page_description;

        // for posts peer page
        var settings_admin_posts_peer_page = req.body.settings_admin_posts_peer_page;
        var settings_posts_peer_page = req.body.settings_posts_peer_page;


        // for current meta reques
        var page_type_current_metas = [];
        if( req.body.update_finish !== undefined ) {
            // each current post meta
            for( var meta_key = 0; meta_key<=parseInt(req.body.update_finish); meta_key++ ) {
                page_type_current_metas.push({
                    page_meta_page_id:req.body[meta_key+"_meta_page_id"],
                    page_meta_title:req.body[meta_key+"_meta_title"],
                    page_meta_name:req.body[meta_key+"_meta_name"],
                    page_meta_type:req.body[meta_key+"_meta_type"],
                });
            }
        }

        // get current settings
        e5ojs_settings_get_all(function(current_settings){
            settings = current_settings;

            for( settings_key in settings ) {
                // validate for site settings
                if( settings[settings_key].settings_id == "settings_host_url" ) {
                    settings[settings_key].settings_value = settings_host_url;
                }
                if( settings[settings_key].settings_id == "settings_home_page_template" ) {
                    settings[settings_key].settings_value = settings_home_page_template;
                }
                // replace posts peer page admin
                if( settings[settings_key].settings_id == 'settings_admin_posts_peer_page' ) {
                    settings[settings_key].settings_value = parseInt(settings_admin_posts_peer_page);
                }
                // replace posts peer page theme
                if( settings[settings_key].settings_id == 'settings_posts_peer_page' ) {
                    settings[settings_key].settings_value = parseInt(settings_posts_peer_page);
                }
                // replace page metas with req data
                if( settings[settings_key].settings_id == 'settings_page_metas' ) {
                    settings[settings_key].settings_value = page_type_current_metas;
                }
                // replace admin page data
                if( settings[settings_key].settings_id == 'settings_admin_pages_data' ) {
                    settings[settings_key].settings_value = settings_admin_pages_data;
                }
            }
            // validate for page new meta
            if( settings_page_meta_title != "" && settings_page_meta_name != "" && settings_page_meta_type != "" && settings_page_meta_post_id != "" ) {
                for( settings_key in settings ) {
                    if( settings[settings_key].settings_id == 'settings_page_metas' ) {
                        settings[settings_key].settings_value.push( {'page_meta_page_id':settings_page_meta_post_id, 'page_meta_title':settings_page_meta_title, 'page_meta_name':settings_page_meta_name, 'page_meta_type':settings_page_meta_type} );
                        break;
                    }
                }
            }


            // save settings
            e5ojs_settings_update(settings, index=0,function(update_result) {
                // set true for front-end refresh routers
                req.app.locals.e5ojs_refresh_router = true;
                // refresh admin pages data
                e5ojs_refresh_admin_pages_data(function(){
                    // redirect to settings page
                    res.redirect(e5ojs_global_data.admin_pages.settings.url);
                });
            });
        });

    });
});

/* end e5ojs settings routers */









/* start e5ojs admin pages routers */
router.get('/media/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        //console.log("ADMIN",e5ojs_global_data.admin_pages.admin_post_types);
        res.render('back-end/e5ojs-admin-media', { page_data: e5ojs_global_data.admin_pages['media'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});



/* media items paginated API */
router.get('/e5ojs-media-api/page/:number_page/', function(req, res, next){
    var number_page = req.params.number_page;

    // get posts
    // get total pages
    var limit_post = 40;
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
    db.e5ojs_media.find({}).sort({'media_date':-1}).count(function(q_req, q_res, q_next){
        total_post = parseInt(q_res);
        total_pages = parseInt(total_post/limit_post);
        total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+parseInt(total_post%limit_post));
    });
    // query with skip page
    db.e5ojs_media.find({}).skip(skip_posts).limit(limit_post, function(err, pages_data){
        // get pagination
        var e5ojs_pagination = e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.admin_pages['media'].url);
        // get media sizes
        var media_sizes = {};
        e5ojs_image_sizes.forEach(function(size,key){
            var size_key = size.width+"x"+size.height;
            media_sizes[size_key] = size_key;
        });
        // render media page
        res.json({"e5ojs_media_api":{ e5ojs_status:1, e5ojs_media_items:pages_data, e5ojs_pagination:e5ojs_pagination, e5ojs_total_media_items:total_post, e5ojs_media_uploads_url:e5ojs_global_data.admin_res.media_uploads_url, e5ojs_media_uploads_sizes_url:e5ojs_global_data.admin_res.media_uploads_sizes_url, e5ojs_media_sizes:media_sizes, e5ojs_total_pages:total_pages }});
    });
});

var e5ojs_delete = require('delete');
router.delete('/e5ojs-media-api/', function(req, res, next){
    var e5ojs_media_ids = req.body.media_ids;
    e5ojs_media_ids_json = JSON.parse(e5ojs_media_ids);
    e5ojs_media_ids = [];
    for( element_key in e5ojs_media_ids_json ) {
        media_id_remove = e5ojs_media_ids_json[element_key].data_media_id;
        e5ojs_media_ids.push(parseInt(media_id_remove));
    }
    e5ojs_media_api_get_media(e5ojs_media_ids, function(media_data_result){
        //console.log("media_data_result",media_data_result);

        var media_file_name = [];
        for( element_key in media_data_result ) {
            media_file_name.push(media_data_result[element_key].media_file_name);
            // sizes
            media_file_name_clean = media_data_result[element_key].media_file_name_clean
            media_mime_type = (media_data_result[element_key].media_mime_type).split("/")[1];
            e5ojs_image_sizes.forEach(function(size,key){
                var size_key = size.width+"x"+size.height;
                media_file_name.push("sizes/"+media_file_name_clean+"-"+size_key+"."+media_mime_type);
            });
        }
        var media_ids_delete = [];
        for( element_key in media_data_result ) {
            media_ids_delete.push( parseInt(media_data_result[element_key].media_id) );
        }
        // delete from DB
        console.log("media_ids_delete",media_ids_delete);
        e5ojs_media_api_delete_media(media_ids_delete, function(result_media_delete){
            console.log("result_media_delete",result_media_delete);
        });
        // delete files
        e5ojs_media_api_delete_files(media_file_name, element_number=0, function(delete_result){
            res.json({e5ojs_media_api_delete:{e5ojs_status:1,e5ojs_delete_status:1,e5ojs_media_ids:req.body}});
        });
    });

});

/* end e5ojs admin pages routers */












/* start e5ojs admin search routers */
router.get('/search/', function(req, res, next) {
    // get page with validate session
    var search_word = req.param('search','');
    if( search_word !== 'undefined' && search_word.length > 1 ) {
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            e5ojs_search(search_word, function(result_search){
                res.render('back-end/e5ojs-search-result', { page_data: e5ojs_global_data.admin_pages['search'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_search:result_search });
            });
        });
    } else {
        res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/");
    }
});

/* end e5ojs admin search routers */


/* ============== end e5ojs router ============== */






























/* ============== start e5ojs mongodb functions =============== */
/*
if "new:true" found object data and override with new object data
if "new:false"  found object data but only update the passed fileds
*/

/* start counter function */
function e5ojs_get_next_id(name,callback) {
    db.e5ojs_counter.findAndModify({query: { '_id': name },update: { $inc: { 'seq': 1 } },new: true},function(err, data){
        // validate error
        callback(data);
    });
}
/* start counter function */





/* start settings function */
function e5ojs_settings_update(settings, settings_count, callback) {

    var settings_id = settings[settings_count].settings_id;
    var settings_value = settings[settings_count].settings_value;
    e5ojs_settings_update_multiple(settings_id, settings_value,function(err, result_settings){
        settings_count = settings_count + 1;
        if( settings_count < settings.length ) {
            e5ojs_settings_update(settings, settings_count, callback); // only pass the callback instead of function to return to the init function call
        } else {
            // return callback
            callback(true);
        }
    });
}
function e5ojs_settings_get_by_id(settings_id, callback) {
    db.e5ojs_settings.find({'settings_id':parseInt(settings_id)},function(err, result_settings){
        if( err )
            callback(null);
        else
            callback(result_settings);
    });
}
function e5ojs_settings_get_all(callback) {
    db.e5ojs_settings.find({},function(err, result_settings){
        if( err )
            callback(null);
        else
            callback(result_settings);
    });
}
function e5ojs_settings_update_multiple(settings_id, settings_value, callback) {
    db.e5ojs_settings.update({'settings_id':settings_id},{$set:{'settings_value':settings_value}},{new:false},function(err, result_settings){
        if( err )
            callback(null);
        else
            callback(result_settings);
    });
}
/* end settings function */




/* start post DB function */
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
function e5ojs_delete_post_status_multiple(post_ids,callback) {
    var ids_array = Array();
    post_ids.forEach(function(val,key){
        ids_array.push( parseInt(post_ids[key]) );
    });
    db.e5ojs_post.remove({'post_id':{$in:ids_array}},function(err, result_data){
        // result : { ok: 1, n: 1 }
        if( err ) {
            callback({ok:0});
        } else {
            if( result_data.ok == 1 && result_data.n > 0 ) {
                callback({status:1});
            } else {
                callback({status:0});
            }
        }
    });
}
/* end post DB function */














/* start media DB function */
function e5ojs_get_all_media(callback) {
    db.e5ojs_media.find({},function(err, media_data){
        // validate error
        if( err ) {
            callback(false);
        } else {
            callback(media_data);
        }
    });
}
function e5ojs_insert_new_media(post_data,callback) {
    db.e5ojs_media.insert(post_data,function(err, result_data){
        // validate error
        callback(result_data);
    });
}
function e5ojs_get_media(media_ids,callback) {
    if( media_ids === undefined ) {
        callback(false);
    }
    var media_ids_array = media_ids.split(",");
    var media_ids = [];
    for( media_key in media_ids_array ) {
        media_ids.push(parseInt(media_ids_array[media_key]));
    }
    db.e5ojs_media.find({'media_id':{$in:media_ids}},function(err, media_data){
        if( err ) {
            callback(false);
        } else {
            if( media_data.length )
                callback(media_data);
            else
                callback(false);
        }
    });
}
/* end media DB function */









/* start post type DB function */
function e5ojs_post_type_get_all(callback) {
    db.e5ojs_post_type.find({'post_type_status':1},function(err,result_data){
        callback(result_data);
    });
}
function e5ojs_post_type_get_by_name(post_type_name,callback) {
    db.e5ojs_post_type.find({'post_type_name':post_type_name},function(err,result_data){
        if( err )
            callback(null);
        else
            callback(result_data);
    });
}
function e5ojs_post_type_get_by_id(post_type_id,callback) {
    db.e5ojs_post_type.find({'post_type_id':post_type_id},function(err,result_data){
        if( err )
            callback(null);
        else
            callback(result_data);
    });
}
function e5ojs_post_type(post_type_id, callback) {
    db.e5ojs_post_type.find({'post_type_id':parseInt(post_type_id)},function(err,result_data){
        callback(result_data);
    });
}
function e5ojs_post_type_insert_new(post_type_data, callback) {
    // get increment e5ojs_media
    e5ojs_get_next_id('post_type',function(data){
        // increment post_type counter
        var next_id = data.seq;
        post_type_data.post_type_id = parseInt(next_id);
        db.e5ojs_post_type.insert(post_type_data,function(err, result_data){
            e5ojs_init(function(){
                callback(result_data);
            });
        });
    });
}
function e5ojs_post_type_update(post_type_data, callback) {
    // update post type data
    // get current post type metas
    //db.e5ojs_post_type.find({'post_type_id':parseInt(post_type_data.post_type_id)},function(err, current_post_type){
        db.e5ojs_post_type.update({'post_type_id':parseInt(post_type_data.post_type_id)},{$set:post_type_data},{new:false},function(err,result_data){
            e5ojs_init(function(){
                callback(result_data);
            });
        });
    //});
}
function e5ojs_post_type_delete(post_type_id, callback) {
    // find post type by id and drop
    db.e5ojs_post_type.remove({'post_type_id':parseInt(post_type_id)},function(err,result_data){
        e5ojs_init(function(){
            callback(result_data);
        });
    });
}
function e5ojs_change_post_type_status_multiple(post_ids,status,callback) {
    var ids_array = Array();
    post_ids.forEach(function(val,key){
        ids_array.push( parseInt(post_ids[key]) );
    });
    db.e5ojs_post_type.update({'post_type_id':{$in:ids_array}},{$set:{'post_type_status':parseInt(status)}},{new: false,multi: true},function(err, result_data){
        // result : WriteResult({ "nMatched" : 3, "nUpserted" : 0, "nModified" : 3 })
        if( err ) {
            callback({ok:0});
        } else {
            if( result_data.nModified > 0 ) {
                e5ojs_init(function(){
                    callback({status:1});
                });
            } else {
                e5ojs_init(function(){
                    callback({status:0});
                });
            }
        }
    });
}
function e5ojs_remove_post_type_status_multiple(post_ids,callback) {
    var ids_array = Array();
    post_ids.forEach(function(val,key){
        ids_array.push( parseInt(post_ids[key]) );
    });
    db.e5ojs_post_type.remove({'post_type_id':{$in:ids_array}},function(err, result_data){
        // result : WriteResult({ "nMatched" : 3, "nUpserted" : 0, "nModified" : 3 })
        if( err ) {
            callback({ok:0});
        } else {
            if( result_data.nModified > 0 ) {
                e5ojs_init(function(){
                    callback({status:1});
                });
            } else {
                e5ojs_init(function(){
                    callback({status:0});
                });
            }
        }
    });
}
/* end post type DB function */






/* start page DB function */
function e5ojs_page_get_all(page_status, callback) {
    db.e5ojs_page.find({'page_status':page_status},function(err, result_pages){
        if( err )
            callback(null);
        else
            callback(result_pages);
    });
}
function e5ojs_page_insert_new(page_data, callback) {
    // get increment e5ojs_media
    e5ojs_get_next_id('page',function(data){
        // increment post_type counter
        var next_id = data.seq;
        page_data.page_id = parseInt(next_id);
        page_data.page_slug = getSlug(remove_diacritics( page_data.page_title ));
        db.e5ojs_page.insert(page_data,function(err, result_data){
            if( err )
                callback(null);
            else
                callback(result_data);
        });
    });
}
function e5ojs_page_get_page(page_id, callback) {
    db.e5ojs_page.find({'page_id':parseInt(page_id)},function(err,result_data){
        if( err )
            callback(null);
        else
            callback(result_data);
    });
}
function e5ojs_page_update(page_data, callback) {
    page_data.page_id = parseInt(page_data.page_id);
    page_data.page_slug = getSlug(remove_diacritics( page_data.page_title ));
    db.e5ojs_page.update({'page_id':parseInt(page_data.page_id)},{$set:page_data},{new:false},function(err,result_data){
        if( err )
            callback(null);
        else
            callback(result_data);
    });
}
function e5ojs_delete_page_status_multiple(page_ids,callback) {
    var ids_array = Array();
    page_ids.forEach(function(val,key){
        ids_array.push( parseInt(page_ids[key]) );
    });
    db.e5ojs_page.remove({'page_id':{$in:ids_array}},function(err, result_data){
        // result : { ok: 1, n: 1 }
        if( err ) {
            callback({ok:0});
        } else {
            if( result_data.ok == 1 && result_data.n > 0 ) {
                callback({status:1});
            } else {
                callback({status:0});
            }
        }
    });
}
function e5ojs_change_page_status_multiple(page_ids,status,callback) {

    var ids_array = Array();
    page_ids.forEach(function(val,key){
        ids_array.push( parseInt(page_ids[key]) );
    });
    db.e5ojs_page.update({'page_id':{$in:ids_array}},{$set:{'page_status':status}},{new: false,multi: true},function(err, result_data){
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
/* end page DB function */












/* start post meta DB function */

function e5ojs_update_post_meta(post_meta_data,callback) {
    if( post_meta_data.length == 0 ) {
        callback(null);
    } else {
        // loop post meta
        var count_meta = 0;
        var total_meta = post_meta_data.length;
        e5ojs_update_post_meta_fill(post_meta_data,count_meta,total_meta,function(result_meta_update){
            callback(result_meta_update);
        });
    }
}
function e5ojs_update_post_meta_fill(post_meta_data,count_meta,total_meta,callback) {
    e5ojs_update_post_meta_save(post_meta_data[count_meta],function(result_meta){
        post_meta_data[count_meta] = result_meta;
        count_meta = count_meta+1;
        if( count_meta < total_meta ) {
            e5ojs_update_post_meta_fill(post_meta_data,count_meta,total_meta,callback);
        } else {
            callback(post_meta_data);
        }
    });
}
function e5ojs_update_post_meta_save(post_meta,callback) {
    db.e5ojs_post_meta.update({'post_meta_id':parseInt(post_meta.post_meta_id),'post_meta_post_id':parseInt(post_meta.post_meta_post_id),'post_meta_name':post_meta.post_meta_name},{$set:{'post_meta_value':post_meta.post_meta_value}},{new:false},function(err,result_meta){
        if( err )
            callback(null);
        else
            callback(result_meta);
    });
}
function e5ojs_insert_post_meta(post_meta_data,callback) {
    if( post_meta_data.length == 0 ) {
        callback(null);
    } else {
        // loop post meta
        var count_meta = 0;
        var total_meta = post_meta_data.length;
        e5ojs_post_meta_fill_data(post_meta_data,count_meta,total_meta,function(post_meta_data_fill){
            //console.log("post_meta_data_fill",post_meta_data_fill);
            // insert post metas
             e5ojs_insert_post_meta_save(post_meta_data_fill,function(post_meta_result){
                 //console.log("post_meta_result",post_meta_result)
                 callback(post_meta_result);
            });
        });
    }
}
function e5ojs_post_meta_fill_data(post_meta_data,count_meta,total_meta,callback) {
    // get next ID
    var post_meta = post_meta_data[count_meta];// get meta data
    // get next id for this meta
    e5ojs_get_next_id("post_meta",function(data){
        var next_id = data.seq;
        post_meta.post_meta_id = next_id;
        post_meta_data[count_meta] = post_meta;
        count_meta = count_meta+1;
        if( count_meta < total_meta ) {
            // next meta
            e5ojs_post_meta_fill_data(post_meta_data,count_meta,total_meta,callback);
        } else {
            // callback
            callback(post_meta_data);
        }
    });
}
function e5ojs_insert_post_meta_save(post_meta_data,callback) {
    db.e5ojs_post_meta.insert(post_meta_data,function(err,result){
        if( err )
            callback(null);
        else
            callback(result);
    });
}
function e5ojs_get_post_meta(post_id,callback) {
    db.e5ojs_post_meta.find({'post_meta_post_id':parseInt(post_id)},function(err,post_meta_result){
        if( err )
            callback(null);
        else
            callback(post_meta_result);
    });
}
/* start post meta DB function */












/* start users DB functions */

function e5ojs_user_insert(user_data, callback) {
    db.e5ojs_user.insert(user_data, function(err, result){
        callback({'error':err, user_data:result});
    });
}
function e5ojs_valid_user_email(user_login,user_email, callback) {
    db.e5ojs_user.find({'user_login':user_login,'user_email':user_email}).count(function(q_req, q_res, q_next){
        total_find = parseInt(q_res);
        callback(total_find);
    });
}
function e5ojs_user_get(user_id, callback) {
    db.e5ojs_user.find({'user_id':parseInt(user_id)}, function(err, user_data){
        callback({'error':err, 'user_data':user_data});
    });
}
function e5ojs_user_update(user_data, callback) {
    db.e5ojs_user.update({'user_id':parseInt(user_data.user_id)},{$set:user_data},{new:false},function(err, user_data){
        callback({'error':err, 'user_data':user_data});
    });
}
function e5ojs_change_user_status_multiple(user_ids,status,callback) {
    var ids_array = Array();
    user_ids.forEach(function(val,key){
        ids_array.push( parseInt(user_ids[key]) );
    });
    db.e5ojs_user.update({'user_id':{$in:ids_array}},{$set:{'user_status':parseInt(status)}},{new:false, multi:true},function(err, result_data){
        if( err ) {
            callback({ok:0});
        } else {
            if( result_data.nModified > 0 ) {
                e5ojs_init(function(){
                    callback({status:1});
                });
            } else {
                e5ojs_init(function(){
                    callback({status:0});
                });
            }
        }
    });
}
function e5ojs_remove_user_status_multiple(user_ids,callback) {
    var ids_array = Array();
    user_ids.forEach(function(val,key){
        ids_array.push( parseInt(user_ids[key]) );
    });
    db.e5ojs_user.remove({'user_id':{$in:ids_array}},function(err, result_data){
        // result : WriteResult({ "nMatched" : 3, "nUpserted" : 0, "nModified" : 3 })
        if( err ) {
            callback({ok:0});
        } else {
            if( result_data.nModified > 0 ) {
                e5ojs_init(function(){
                    callback({status:1});
                });
            } else {
                e5ojs_init(function(){
                    callback({status:0});
                });
            }
        }
    });
}

/* end users DB functions */













/* start Media API DB functions */

function e5ojs_media_api_get_media(media_ids, callback) {
    db.e5ojs_media.find({'media_id':{$in:media_ids}},function(err, media_result){
        if( err )
            callback([]);
        else
            callback(media_result);
    });
}
function e5ojs_media_api_delete_media(media_ids, callback) {
    db.e5ojs_media.remove({'media_id':{$in:media_ids}},function(err, result_media_delete){
        if( err )
            callback([]);
        else
            callback(result_media_delete);
    });
};

/* end Media API DB functions */















/* start SEARCH DB functions */

function e5ojs_search(key_words, callback) {
    // before this you need indexes the each documents
    // db.e5ojs_page.createIndex({"page_title":"text"})
    var result_search = [];
    db.e5ojs_page.find({$text: {$search:key_words} }, function(err, page_result){
        if( page_result.length > 0 ) {
            for( page_key in page_result ) {
                result_search.push( {
                    id: page_result[page_key].page_id,
                    title: page_result[page_key].page_title,
                    url: host_url+"/admin/page/action/edit/"+page_result[page_key].page_id,
                });
            }
        }
        // get post types
        db.e5ojs_post_type.find({},function(err, post_types_result){
            var post_types = [];
            for( post_type_key in post_types_result ) {
                post_types.push({post_type_id:post_types_result[post_type_key].post_type_id, slug:post_types_result[post_type_key].post_type_slug});
            }
            db.e5ojs_post.find({$text: {$search:key_words} }, function(err, post_result){
                if( post_result.length > 0 ) {
                    for( post_key in post_result ) {
                        for( pp_key in post_types ) {
                            if( post_types[pp_key].post_type_id == post_result[post_key].post_post_type_id ) {
                                result_search.push( {
                                    id: post_result[post_key].post_id,
                                    title: post_result[post_key].post_title,
                                    url: host_url+"/admin/post-type/"+post_types[pp_key].slug+"/action/edit/"+post_result[post_key].post_id,
                                });
                                break;
                            }
                        }
                    }
                }
                callback(result_search);
            });
        });
    });
}
/* end SEARCH DB functions */

/* ============== end e5ojs mongodb functions =============== */



























/* ============== start e5ojs validate session functions =============== */

function e5ojs_validate_admin_session_callback(req, res, callback) {
    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // session vars exists
        // get session user data
        var user_login = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // ask to DB for this user credentials
        e5ojs_get_user_info_callback(user_login,user_pass,use_md5=false,function(user_data){
            // validate request user db result
            // get menu data as post types data routers
            //e5ojs_global_data_init(); // init global object data
            e5ojs_init(function(){

                if( user_data.result_login ) {
                    // user credentials are ok
                    // save user data on session var
                    var e5ojs_session = req.session;
                    e5ojs_session.e5ojs_user_data = user_data.e5ojs_user_data[0];
                    user_data.e5ojs_user_data[0].user_avatar_url = "http://nodejs.dev/back-end/assets/default-profile-image.jpg";
                    user_data.e5ojs_user_data[0].user_bkg_url = "http://nodejs.dev/back-end/assets/profile-menu.jpg";
                    // return status and user info
                    // get user avatar and wallpaper
                    var user_avatar_media_id = e5ojs_session.e5ojs_user_data.user_avatar_media_id;
                    var user_bkg_media_id = e5ojs_session.e5ojs_user_data.user_bkg_media_id;
                    e5ojs_media_api_get_media(media_ids=[user_avatar_media_id,user_bkg_media_id], function(media_data_result){
                        for( media_key in media_data_result ) {
                            if( user_avatar_media_id == media_data_result[media_key].media_id ) {
                                ext = media_data_result[media_key].media_mime_type.split("/");
                                user_data.e5ojs_user_data[0].user_avatar_url = e5ojs_global_data.admin_res.media_uploads_sizes_url+media_data_result[media_key].media_file_name_clean+"-150x150."+ext[1];
                            }
                            if( user_bkg_media_id == media_data_result[media_key].media_id ) {
                                ext = media_data_result[media_key].media_mime_type.split("/");
                                user_data.e5ojs_user_data[0].user_bkg_url = e5ojs_global_data.admin_res.media_uploads_sizes_url+media_data_result[media_key].media_file_name_clean+"-300x150."+ext[1];
                            }
                        }
                        callback(user_data);
                    });
                } else {
                    // user not found or user credentials not match
                    // clear session data
                    var e5ojs_session = req.session;
                    e5ojs_session.e5ojs_user_data = null;
                    e5ojs_session.destroy();
                    // render login page
                    res.render('back-end/e5ojs-login', { page_data: e5ojs_global_data.admin_other_pages['login'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:null });
                }

            });
        });
    } else {
        // session vars does not exists
        // check for post vars
        var user_login = req.body.user_login;
        var user_pass = req.body.user_pass;
        // validate for empty vars on body = {}
        if( req.body != null ) {
            // ask to DB for this user credentials
            e5ojs_get_user_info_callback(user_login,user_pass,use_md5=true,function(user_data){
                // validate request user db result
                if( user_data.result_login ) {
                    // user credentials are ok
                    // save user data on session var
                    var e5ojs_session = req.session;
                    e5ojs_session.e5ojs_user_data = user_data.e5ojs_user_data[0];

                    user_data.e5ojs_user_data[0].user_avatar_url = "http://nodejs.dev/back-end/assets/default-profile-image.jpg";
                    user_data.e5ojs_user_data[0].user_bkg_url = "http://nodejs.dev/back-end/assets/profile-menu.jpg";
                    // return status and user info
                    // get user avatar and wallpaper
                    var user_avatar_media_id = e5ojs_session.e5ojs_user_data.user_avatar_media_id;
                    var user_bkg_media_id = e5ojs_session.e5ojs_user_data.user_bkg_media_id;
                    e5ojs_media_api_get_media(media_ids=[user_avatar_media_id,user_bkg_media_id], function(media_data_result){
                        for( media_key in media_data_result ) {
                            if( user_avatar_media_id == media_data_result[media_key].media_id ) {
                                ext = media_data_result[media_key].media_mime_type.split("/");
                                user_data.e5ojs_user_data[0].user_avatar_url = e5ojs_global_data.admin_res.media_uploads_sizes_url+media_data_result[media_key].media_file_name_clean+"-150x150."+ext[1];
                            }
                            if( user_bkg_media_id == media_data_result[media_key].media_id ) {
                                ext = media_data_result[media_key].media_mime_type.split("/");
                                user_data.e5ojs_user_data[0].user_bkg_url = e5ojs_global_data.admin_res.media_uploads_sizes_url+media_data_result[media_key].media_file_name_clean+"-300x150."+ext[1];
                            }
                        }
                        callback(user_data);
                    });
                } else {
                    // user not found or user credentials not match
                    // clear session data
                    var e5ojs_session = req.session;
                    e5ojs_session.e5ojs_user_data = null;
                    e5ojs_session.destroy();
                    // render login page
                    res.render('back-end/e5ojs-login', { page_data: e5ojs_global_data.admin_other_pages['login'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:null });
                }
            });
        } else {
            // clear session
            var e5ojs_session = req.session;
            e5ojs_session.e5ojs_user_data = null;
            e5ojs_session.destroy();
            // render login page
            res.render('back-end/e5ojs-login', { page_data: e5ojs_global_data.admin_other_pages['login'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:null });
        }
    }
}

function e5ojs_get_user_info_callback(user_login,user_pass,use_md5,callback) {
    // get post user data
    var user_login = user_login;
    var user_pass = ((use_md5)?md5(user_pass):user_pass); // admin = 21232f297a57a5a743894a0e4a801fc3
    // request user on DB
    db.e5ojs_user.find({'user_login':user_login,'user_pass':user_pass}, function(err, user){
        if( err ) {
            callback({ result_login:0, error:err });
        } else {
            if( user.length ) {
                // user exists and it will be returned
                callback({ result_login:1, e5ojs_user_data:user, error:err });
            } else {
                // user data does not exists on DB
                callback({ result_login:0, error:err });
            }
        }
    });
}

/* ============== end e5ojs validate session functions =============== */




















/* ============== start e5ojs function ============== */

/* start resize image files */
function e5ojs_generate_image_file(img_object_data,callback) {

    var media_file_name = img_object_data.media_file_name.split("/");
    media_file_name = media_file_name[media_file_name.length-1];
    media_file_name = (media_file_name.split("."))[0];
    var file_ext = (img_object_data.media_mime_type.split("/"))[1];
    // paths
    var file_path =  __dirname + '/../public/uploads/'+media_file_name+"."+file_ext;
    var file_path_to_save =__dirname + '/../public/uploads/'+e5ojs_folder_images_sizes+media_file_name+"-"+e5ojs_image_sizes[image_sizes_pointer].width+"x"+e5ojs_image_sizes[image_sizes_pointer].height+"."+file_ext;

    // generate array to return with sizes to attach on req json
    var size_string = e5ojs_image_sizes[image_sizes_pointer].width+"x"+e5ojs_image_sizes[image_sizes_pointer].height;
    var file_size_name = e5ojs_global_data.admin_res.media_uploads_sizes_url+media_file_name+"-"+e5ojs_image_sizes[image_sizes_pointer].width+"x"+e5ojs_image_sizes[image_sizes_pointer].height+"."+file_ext;
    e5ojs_sizes_return[size_string] = file_size_name;


    // generate images sizes
    var crop_error = false;
    e5ojs_crop_image(file_path,file_path_to_save,e5ojs_image_sizes[image_sizes_pointer],function(err){
        if( err ) {
            crop_error = true;
        }
        // next image crop
        image_sizes_pointer = image_sizes_pointer+1;
        if( image_sizes_pointer < e5ojs_image_sizes.length ) {
            e5ojs_generate_image_file(img_object_data,callback);
        } else {
            // return result
            image_sizes_pointer = 0;
            callback(crop_error);
        }
    });

}
function e5ojs_crop_image(image_path,image_path_to_save,image_size,callback) {
    // obtain an image object:
    var lwip = require('lwip');
    var error = false;
    // generate images sizes
    lwip.open(image_path, function(err, image){
        if( err )
            callback(err);
        // define a batch of manipulations and save to disk as JPEG:
        image.batch()
        .scale(0.80)
        .crop(image_size.width, image_size.height) // crop a 200X200 square from center
        .writeFile(image_path_to_save, function(err){
            if( err )
                callback(error);
            else
                callback(error);
        });
    });
}
/* end resize image files */









/*  start e5ojs session message functions  */
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
/*  end e5ojs session message functions  */













/* start for files */
function e5ojs_read_template_files_json(callback) {
    fs = require('fs');
    fs.readFile(__dirname+'/../views/front-end/e5ojs-templates.json', 'utf8', function (err,file_data) {
        if (err) {
            callback(null);
        } else {
            var templates_json = JSON.parse(file_data);
            callback(templates_json);
        }
    });
}
/* end for files */






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





/* start Media functions for files */

function e5ojs_media_api_delete_files(media_names, element_number, callback) {
    for( element_key in media_names ) {
        file_name = __dirname + '/../public/uploads/'+media_names[element_key];
        //console.log("dir_file",file_name);
        // sync
        e5ojs_delete.sync(file_name, {force: true});
    }
    callback({status:1});
}

/* end Media functions for files */

/* ============== end e5ojs function ============== */










module.exports = router;
