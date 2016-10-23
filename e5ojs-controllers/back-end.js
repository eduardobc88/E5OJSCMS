var file_name = "back-end.js";
console.log(file_name,"Module loaded...");


/* ============== start e5ojs requires ============== */

// expressjs for routers
var express = require('express');
var router = express.Router();
// MD5
var md5 = require('md5');
// format date
var date_format = require('dateformat');
var current_date = new Date();
// remove diacritics
var remove_diacritics = require('diacritics').remove;
// generate slug from string
var getSlug = require('speakingurl');
// for image processing
var multer = require('multer');


// mongodb
var e5ojs_db = require('../e5ojs-config/e5ojs-mongodb.js');


// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config/e5ojs-config.js");
e5ojs_config.e5ojs_router = router; // pass the router for use in other files !important
var e5ojs_init = require('../e5ojs-modules/e5ojs-init.js');
var e5ojs_session = require('../e5ojs-modules/e5ojs-session.js');
var e5ojs_search = require('../e5ojs-modules/e5ojs-search.js');
var e5ojs_settings = require('../e5ojs-modules/e5ojs-settings.js');
var e5ojs_counter = require('../e5ojs-modules/e5ojs-counter.js');
var e5ojs_user = require('../e5ojs-modules/e5ojs-user.js');
var e5ojs_media = require('../e5ojs-modules/e5ojs-media.js');
var e5ojs_page = require('../e5ojs-modules/e5ojs-page.js');
var e5ojs_post = require('../e5ojs-modules/e5ojs-post.js');
var e5ojs_post_meta = require('../e5ojs-modules/e5ojs-post-meta.js');
var e5ojs_post_type = require('../e5ojs-modules/e5ojs-post-type.js');
var e5ojs_session_message = require('../e5ojs-modules/e5ojs-session-message.js');
var e5ojs_post_type_router = require('../e5ojs-modules/e5ojs-post-type-router.js');
var e5ojs_base_pagination = require('../e5ojs-modules/e5ojs-pagination.js');
// e5ojs end local requires settings



/* ============== end e5ojs requires ============== */












/* ============== start e5ojs global var ============== */

//var host_url = e5ojs_config.e5ojs_host_url; // change for current host ip or domain
var e5ojs_global_data = e5ojs_config.e5ojs_global_data; // contains all urls for admin
// for image processing
var e5ojs_image_sizes = new Array({width:150,height:150},{width:200,height:200},{width:300,height:150},{width:800,height:200});
var image_sizes_pointer = 0;
var e5ojs_folder_images_sizes = "sizes/";
var e5ojs_sizes_return = {};


/* start filter upload files */
var maxSize = (2.5) * 1000 * 1000; // max file size 1 = 1024kb
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/../e5ojs-public/uploads/');
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
            e5ojs_counter.e5ojs_get_next_id('media',function(data){
                var next_id = data.seq;
                file_data.media_id = next_id;
                // save on DB
                //console.log(file_data);
                e5ojs_media.e5ojs_insert_new_media(file_data,function(result_data){
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
e5ojs_init.e5ojs_global_data_init();
/* ============== end e5ojs configuration ============== */






















/* ============== start e5ojs router ============== */


/* start get current page request */
router.get('*', function(req, res, next) {
    //console.log( " === REQUEST PAGE === ", req.originalUrl );

    if( e5ojs_config.e5ojs_refresh_admin_router == true ) {
        console.log(" ============ E5OJS Admin Regenerate Router ============= ",e5ojs_config.e5ojs_refresh_admin_router);
        e5ojs_config.e5ojs_refresh_admin_router = false;
        // create function to regenerate admin router urls
        // when delete post type
    }

    var original_url = req.originalUrl;
    var element_page_key = "dashboard";
    e5ojs_global_data.current_post_type_key = "";
    for( admin_page_key in e5ojs_global_data.admin_pages ) {
        var admin_page = e5ojs_global_data.admin_pages[admin_page_key];
        var admin_page_url = admin_page.url;
        admin_page = admin_page.url;
        if( admin_page !== undefined ) {
            admin_page = admin_page.replace(e5ojs_config.e5ojs_host_url,"");
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
                    admin_page = admin_page.replace(e5ojs_config.e5ojs_host_url,"");
                    if( original_url.indexOf(admin_page) >= 0 && admin_page.length > 1) {
                        element_page_key = admin_page_key;
                        // get post type key
                        var admin_url_array = admin_page.split("/");
                        e5ojs_global_data.current_post_type_key = admin_url_array[admin_url_array.indexOf("post-type")+1]; // /post-type/blogcito/
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
            admin_page = admin_page.replace(e5ojs_config.e5ojs_host_url,"");
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
                    admin_page = admin_page.replace(e5ojs_config.e5ojs_host_url,"");
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin', { page_data: e5ojs_global_data.admin_pages['dashboard'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.post('/', function(req, res, next) {
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin', { page_data: e5ojs_global_data.admin_pages['dashboard'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.get('/admin/', function(req, res, next) {
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        //console.log("e5ojs_global_data",e5ojs_global_data);
        res.render('back-end/e5ojs-admin', { page_data: e5ojs_global_data.admin_pages['dashboard'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.get('/log-out/', function(req, res, next) {
    e5ojs_init.e5ojs_global_data_init();
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        //res.render('back-end/e5ojs-admin-new-post', { title: 'NEW POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
        e5ojs_media.e5ojs_get_all_media(function(media_data){
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        var media_id = req.params.media_id;
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        e5ojs_media.e5ojs_get_media(media_id,function(media_data){
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














/* start e5ojs pages routers */
router.get('/page/', function(req, res, next) {
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/all/page/1/");
    });
});
router.get('/page/:page_status/page/:number_page/', function(req, res, next) {


    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
        var limit_post = e5ojs_config.e5ojs_admin_post_peer_page;
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
        e5ojs_db.e5ojs_page.find({'page_status':{$in:post_status_array}}).sort({'post_page_id':-1}).count(function(q_req, q_res, q_next){
            total_post = parseInt(q_res);
            total_pages = parseInt(total_post/limit_post);
            total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+((parseInt(total_post%limit_post) > 0)?2:1));
        });
        // query with skip page
        e5ojs_db.e5ojs_page.find({'page_status':{$in:post_status_array}}).sort({'post_type_id':-1}).skip(skip_posts).limit(limit_post, function(err, pages_data){
            // get pagination
            var e5ojs_pagination = e5ojs_base_pagination.e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.admin_pages['pages'].url+post_status+"/");
            // get session message
            var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
            // remove session message
            e5ojs_session_message.e5ojs_clear_session_message(req);
            // render post type page
            res.render('back-end/e5ojs-admin-pages', { page_data: e5ojs_global_data.admin_pages['pages'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, pages_data:pages_data, e5ojs_pagination:e5ojs_pagination, page_status:post_status });
        });

    });
});
router.get('/page/action/new/', function(req, res, next) {
    // return the template to add new page
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        e5ojs_read_template_files_json(function(templates_json){
            // check if has message session
            // get session message
            var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
            // remove session message
            e5ojs_session_message.e5ojs_clear_session_message(req);
            res.render('back-end/e5ojs-admin-page', { page_data: e5ojs_global_data.admin_pages['pages'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], pages_data:null, e5ojs_message:e5ojs_message, e5ojs_templates_json:templates_json });
        });
    });
});
router.post('/page/action/edit/:page_status/', function(req, res, next) {
    // save the new page and redirect to edit/:page_id
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
        e5ojs_page.e5ojs_page_insert_new(page_data,function(page_data_result){

            var e5ojs_message = null;
            if( page_data_result != null ) {
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'New page created.'};
            } else {
                e5ojs_message = {'status':1,'type':'error','text':'The page was not created.'};
            }
            // save message on session var
            e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
            // set true for front-end refresh routers
            e5ojs_config.e5ojs_refresh_router = true;
            // response
            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/action/edit/"+page_data_result.page_id+"/");
        });
    });
});
router.get('/page/action/edit/:page_id/', function(req, res, next) {
    // return the page data to edit
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default
            // get page id
            var page_id = req.params.page_id;


            // get page metas to match
            e5ojs_settings.e5ojs_settings_get_all(function(current_settings){
                // page metas
                var post_type_meta = [];
                for( settings_key in current_settings ) {
                    if( current_settings[settings_key].settings_id == "settings_page_metas" ) {
                        post_type_meta = current_settings[settings_key].settings_value;
                        break;
                    }
                }

                // get post meta
                e5ojs_post_meta.e5ojs_get_post_meta(page_id,function(current_post_meta){
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
                    e5ojs_page.e5ojs_page_get_page(page_id,function(page_data){
                        if( page_data == null ) {
                            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/action/new/");
                        } else {
                            // get image from DB
                            e5ojs_media.e5ojs_get_media(page_data[0].page_media_id,function(media_result){
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
                                var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
                                // remove session message
                                e5ojs_session_message.e5ojs_clear_session_message(req);
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
        e5ojs_settings.e5ojs_settings_get_all(function(current_settings){
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
            e5ojs_post_meta.e5ojs_get_post_meta(page_id,function(current_post_meta_saved){
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
                e5ojs_post_meta.e5ojs_update_post_meta(post_meta_update,function(update_post_meta_result){
                    //console.log("update_post_meta_result",update_post_meta_result);
                    // insert post meta on DB
                    e5ojs_post_meta.e5ojs_insert_post_meta(post_meta_save,function(insert_post_meta_result){
                        //console.log("insert_post_meta_result",insert_post_meta_result);
                        // update page and redirect with id returned
                        e5ojs_page.e5ojs_page_update(page_data,function(page_data_result){
                            var e5ojs_message = null;
                            if( page_data_result != null ) {
                                // show notification
                                e5ojs_message = {'status':1,'type':'done','text':'Page updated'};
                            } else {
                                e5ojs_message = {'status':1,'type':'error','text':'Page no updated'};
                            }
                            // save message on session var
                            e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                            // set true for front-end refresh routers
                            e5ojs_config.e5ojs_refresh_router = true;
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
            e5ojs_page.e5ojs_delete_page_status_multiple(post_ids,function(data){
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
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                e5ojs_config.e5ojs_refresh_router = true;
                // redirect to posts archive
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/page/all/page/1/");
            });
        } else {
            //console.log("post_set_status : ",post_set_status);
            // multiple post ids
            // update posts
            e5ojs_page.e5ojs_change_page_status_multiple(post_ids,post_set_status,function(data){ //aqui
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
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                e5ojs_config.e5ojs_refresh_router = true;
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        e5ojs_post_type.e5ojs_post_type_get_all(function(post_types){
            // e5ojs_global_data  and e5ojs_user_data default
            e5ojs_read_template_files_json(function(templates_json){
                // check if has message session
                // get session message
                var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
                // remove session message
                e5ojs_session_message.e5ojs_clear_session_message(req);
                // render post type page
                res.render('back-end/e5ojs-admin-post-type-edit', { page_data: e5ojs_global_data.admin_other_pages['new_post_type'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, post_types:post_types, e5ojs_templates_json:templates_json });
            });
        });
    });
});
router.post('/post-types/action/edit/', function(req, res, next) {
    // save the new post type
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
        e5ojs_post_type.e5ojs_post_type_insert_new({'post_type_id':'','post_type_title':post_type_title,'post_type_name':post_type_name,'post_type_description':post_type_description,'post_type_slug':post_type_slug,post_type_status:parseInt(post_type_status),post_type_meta:post_type_meta,post_type_archive_template:post_type_archive_template,post_type_single_template:post_type_single_template},function(post_type_data){
            // create session message
            var e5ojs_message = null;
            // show notification
            e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type created'};
            // save message on session var
            e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
            // redirect to de same page
            // set true for front-end refresh routers
            e5ojs_config.e5ojs_refresh_router = true;
            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/action/edit/"+post_type_data.post_type_id);
        });
    });
});
router.get('/post-types/action/edit/:post_type_id/', function(req, res, next) {
    // get the current post
    var post_type_id = req.params.post_type_id;
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        e5ojs_post_type.e5ojs_post_type(post_type_id,function(post_type){
            // e5ojs_global_data  and e5ojs_user_data default
            e5ojs_read_template_files_json(function(templates_json){
                // check if has message session
                // get session message
                var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
                // remove session message
                e5ojs_session_message.e5ojs_clear_session_message(req);
                // render post type page
                res.render('back-end/e5ojs-admin-post-type-edit', {  post_type_info:post_type[0] ,page_data: e5ojs_global_data.admin_other_pages['edit_post_type'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, e5ojs_templates_json:templates_json });
            });
        });
    });
});
router.post('/post-types/action/edit/:post_type_id/', function(req, res, next) {
    // save the current post type
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
        var post_type_meta_to_remove = req.body.post_type_delete_meta;

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
            // check for remove meta
            if( post_type_meta_to_remove !== undefined ) {
                if( !Array.isArray(post_type_meta_to_remove) ) {
                    post_type_meta_to_remove = new Array(post_type_meta_to_remove);
                }
                post_type_current_metas.forEach(function(meta_val,meta_key){
                    post_type_meta_to_remove.forEach(function(meta_rm_val,meta_rm_key){
                        if( meta_val.meta_name == meta_rm_val ) {
                            // mark meta from array to remove
                            post_type_current_metas[meta_key] = "rm";
                        }
                    });
                });
                // get only no remove meta
                var post_type_metas_to_save = [];
                post_type_current_metas.forEach(function(meta_val,meta_key){
                    if( meta_val != "rm" ) {
                        post_type_metas_to_save.push(meta_val);
                    }
                });
                post_type_current_metas = post_type_metas_to_save;
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
        //process.exit(1);
        if( post_type_status == 1 || post_type_status == 0 ) {
            //console.log(" === post_type_current_metas A === ",post_type_current_metas);
            // update post type
            e5ojs_post_type.e5ojs_post_type_update({'post_type_id':parseInt(post_type_id),'post_type_title':post_type_title,'post_type_name':post_type_name,'post_type_description':post_type_description,'post_type_slug':post_type_slug,post_type_status:parseInt(post_type_status),post_type_meta:post_type_current_metas,post_type_archive_template:post_type_archive_template,post_type_single_template:post_type_single_template},function(post_type_data){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type updated'};
                // save message on session var
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                e5ojs_config.e5ojs_refresh_router = true;
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/action/edit/"+post_type_id);
            });
        } else {
            // remove post type
            e5ojs_post_type.e5ojs_post_type_delete(post_type_id,function(post_type_data){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type deleted'};
                // save message on session var
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                e5ojs_config.e5ojs_refresh_router = true;
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {

        if( post_type_action == 1 || post_type_action == 0 ) {
            // update post status
            e5ojs_post_type.e5ojs_change_post_type_status_multiple(post_type_id,post_type_action,function(result){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type updated'};
                // save message on session var
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                e5ojs_config.e5ojs_refresh_router = true;
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/all/page/1/");
            });
        } else {
            // remove post types
            e5ojs_post_type.e5ojs_remove_post_type_status_multiple(post_type_id,function(result){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type removed'};
                // save message on session var
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                // set true for front-end refresh routers
                e5ojs_config.e5ojs_refresh_router = true;
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/all/page/1/");
            });
        }
    });
});
router.get('/post-types/', function(req, res, next) {
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // redirect to de same page
        res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-types/all/page/1/");
    });
});
router.get('/post-types/:post_type_status/page/:number_page/', function(req, res, next) {
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
        var limit_post = e5ojs_config.e5ojs_admin_post_peer_page;
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
        e5ojs_db.e5ojs_post_type.find({'post_type_status':{$in:post_status_array}}).sort({'post_type_id':-1}).count(function(q_req, q_res, q_next){
            total_post = parseInt(q_res);
            total_pages = parseInt(total_post/limit_post);
            total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+((parseInt(total_post%limit_post) > 0)?2:1));
        });
        // query with skip page
        e5ojs_db.e5ojs_post_type.find({'post_type_status':{$in:post_status_array}}).sort({'post_type_id':-1}).skip(skip_posts).limit(limit_post, function(err, post_types){
            // get pagination
            var e5ojs_pagination = e5ojs_base_pagination.e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.admin_pages['post_type'].url+post_type_status+"/");
            // get session message
            var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
            // remove session message
            e5ojs_session_message.e5ojs_clear_session_message(req);
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/all/page/1/");
    });
});
router.get('/users/:user_status/page/:number_page/', function(req, res, next) {
    // get page with validate session
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
        var limit_post = e5ojs_config.e5ojs_admin_post_peer_page;
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
        e5ojs_db.e5ojs_user.find({'user_status':{$in:post_status_array}}).sort({'user_id':-1}).count(function(q_req, q_res, q_next){
            total_post = parseInt(q_res);
            total_pages = parseInt(total_post/limit_post);
            total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+((parseInt(total_post%limit_post) > 0)?2:1));
        });
        // query with skip page
        e5ojs_db.e5ojs_user.find({'user_status':{$in:post_status_array}}).sort({'user_id':-1}).skip(skip_posts).limit(limit_post, function(err, users_data){
            // get pagination
            var e5ojs_pagination = e5ojs_base_pagination.e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.admin_pages['users'].url+user_status+"/");
            // get session message
            var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
            // remove session message
            e5ojs_session_message.e5ojs_clear_session_message(req);
            // render post type page
            res.render('back-end/e5ojs-admin-users', { page_data: e5ojs_global_data.admin_pages['users'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, users_data:users_data, e5ojs_pagination:e5ojs_pagination, post_status:user_status });
        });
    });
});
router.get('/users/action/new/', function(req, res, next) {
    // get page with new user form
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // get session message
        var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
        // remove session message
        e5ojs_session_message.e5ojs_clear_session_message(req);
        res.render('back-end/e5ojs-admin-users-edit', { page_data: e5ojs_global_data.admin_pages['users'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], user_info:[], e5ojs_message:e5ojs_message});
    });
});
router.post('/users/action/edit/', function(req, res, next) {
    // save new user and redirect to edit user
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
        e5ojs_user.e5ojs_valid_user_email(user_data.user_login,user_data.user_email,function(total_users_find){
            if( total_users_find <= 0 ) {
                // pass
                // get next user id
                e5ojs_counter.e5ojs_get_next_id('users',function(data){
                    // increment post_type counter
                    user_data.user_id = parseInt(data.seq);
                    // insert new user
                    e5ojs_user.e5ojs_user_insert(user_data, function(result){
                        if( result.error ) {
                            // fail
                            // create session message
                            var e5ojs_message = null;
                            // show notification
                            e5ojs_message = {'status':1,'type':'error','text':'Error - The user has not created, try again.'};
                            // save message on session var
                            e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                            // redirecto to create new user
                            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/action/new/");
                        } else {
                            // done
                            // create session message
                            var e5ojs_message = null;
                            // show notification
                            e5ojs_message = {'status':1,'type':'done','text':'Successfully - User has been created.'};
                            // save message on session var
                            e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                            // redirecto to edit thos new user created
                            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/action/edit/"+result.user_data.user_id+"/");
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
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/action/new/");
                //res.render('back-end/e5ojs-admin-users-edit', { page_data: e5ojs_global_data.admin_pages['users'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], users_data:[]});
            }
        });
    });
});
router.get('/users/action/edit/:user_id/', function(req, res, next) {
    // get user with id and return user info with data to edit
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // get user data
        var user_id = req.params.user_id;
        e5ojs_user.e5ojs_user_get(user_id, function(user_result_data) {
            if( user_result_data.error ) {
                // error at user id
                // generate message and redirect to users
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'error','text':'Error - The user doesn´t exists'};
                // save message on session var
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/all/page/1/");
            } else {
                // done
                // get session message
                var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
                // remove session message
                e5ojs_session_message.e5ojs_clear_session_message(req);
                // render
                res.render('back-end/e5ojs-admin-users-edit', { page_data: e5ojs_global_data.admin_pages['users'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, user_info:user_result_data.user_data[0]});
            }
        });

    });
});
router.post('/users/action/edit/:user_id/', function(req, res, next) {
    // update user data
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {

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
        e5ojs_user.e5ojs_user_update(user_data, function(user_result_data) {
            if( user_result_data.error ) {
                // error at user id
                // generate message and redirect to users
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'error','text':'Error - Update error.'};
                // save message on session var
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                // redirecto to edit thos new user created
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/action/edit/"+user_data.user_id+"/");
            } else {
                // generate message and redirect to users
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - User has been updated.'};
                // save message on session var
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {

        if( user_status_action == 1 || user_status_action == 0 ) {
            // update post status
            e5ojs_user.e5ojs_change_user_status_multiple(user_ids,user_status_action,function(result){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Users updated'};
                // save message on session var
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                // redirect to de same page
                res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/users/all/page/1/");
            });
        } else {
            // remove post types
            e5ojs_user.e5ojs_remove_user_status_multiple(user_ids,function(result){
                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Users removed'};
                // save message on session var
                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // get settings
        e5ojs_settings.e5ojs_settings_get_all(function(result_settings){
            var settings_data = {};
            settings_data.current_settings = {};
            if( result_settings != null )
                settings_data.current_settings = result_settings;
            // get all publish pages for
            e5ojs_page.e5ojs_page_get_all('publish',function(result_pages){
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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

        // get metas ids to remove
        var settings_page_metas_to_remove = req.body.settings_delete_page_meta;

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
        e5ojs_settings.e5ojs_settings_get_all(function(current_settings){
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

                    // remove page metas by ID if exists
                    if( settings_page_metas_to_remove !== undefined ) {
                        if( !Array.isArray(settings_page_metas_to_remove) ) {
                            settings_page_metas_to_remove = new Array(settings_page_metas_to_remove);
                        }
                        //console.log("settings_page_metas_to_remove",settings_page_metas_to_remove);
                        settings_page_metas_to_remove_alternative = new Array();
                        settings_page_metas_to_remove.forEach(function(meta_rm_val,meta_rm_key){
                            element_arr = meta_rm_val.split("|");
                            settings_page_metas_to_remove_alternative.push(new Array(element_arr[0],element_arr[1]));
                        });
                        // mark metas to remove
                        page_type_current_metas.forEach(function(meta_val,meta_key){
                            settings_page_metas_to_remove_alternative.forEach(function(meta_rm_val,meta_rm_key){
                                if( meta_val.page_meta_page_id == meta_rm_val[0] && meta_val.page_meta_name == meta_rm_val[1] ) {
                                    // mark meta to remove
                                    page_type_current_metas[meta_key] = "rm";
                                }
                            });
                        });
                        // get only no remove meta
                        var page_type_metas_to_save = [];
                        page_type_current_metas.forEach(function(meta_val,meta_key){
                            if( meta_val != "rm" ) {
                                page_type_metas_to_save.push(meta_val);
                            }
                        });
                        page_type_current_metas = page_type_metas_to_save;

                    }
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
            e5ojs_settings.e5ojs_settings_update(settings, index=0,function(update_result) {
                // set true for front-end refresh routers
                e5ojs_config.e5ojs_refresh_router = true;
                // refresh admin pages data
                e5ojs_init.e5ojs_refresh_admin_pages_data(function(){
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
    e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
    e5ojs_db.e5ojs_media.find({}).sort({'media_date':-1}).count(function(q_req, q_res, q_next){
        total_post = parseInt(q_res);
        total_pages = parseInt(total_post/limit_post);
        total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+((parseInt(total_post%limit_post) > 0)?2:1));
    });
    // query with skip page
    e5ojs_db.e5ojs_media.find({}).skip(skip_posts).limit(limit_post, function(err, pages_data){
        // get pagination
        var e5ojs_pagination = e5ojs_base_pagination.e5ojs_get_pagination(total_pages,current_page,total_post,base_url=e5ojs_global_data.admin_pages['media'].url);
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
    e5ojs_media.e5ojs_media_api_get_media(e5ojs_media_ids, function(media_data_result){
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
        e5ojs_media.e5ojs_media_api_delete_media(media_ids_delete, function(result_media_delete){
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
        e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            e5ojs_search.search(search_word, function(result_search){
                res.render('back-end/e5ojs-search-result', { page_data: e5ojs_global_data.admin_pages['search'], e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_search:result_search });
            });
        });
    } else {
        res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/");
    }
});

/* end e5ojs admin search routers */


/* ============== end e5ojs router ============== */



























































































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























/* start for files */
function e5ojs_read_template_files_json(callback) {
    fs = require('fs');
    fs.readFile(__dirname+'/../e5ojs-views/front-end/e5ojs-templates.json', 'utf8', function (err,file_data) {
        if (err) {
            callback(null);
        } else {
            var templates_json = JSON.parse(file_data);
            callback(templates_json);
        }
    });
}
/* end for files */










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
