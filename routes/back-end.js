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












/* start global data var */
var e5ojs_global_data = {};
function e5ojs_init() {
    // load all post types
    e5ojs_global_data.e5ojs_post_types = new Array();
    e5ojs_post_type_get_all(function(post_types){
        e5ojs_global_data.e5ojs_post_types = post_types;
        // set router for each post type
        for( var key in post_types ) {
            var post_type = post_types[key];
            //console.log("POST TYPE",post_type.post_type_title+" GET REQUEST");
            e5ojs_add_post_type_router(post_type);
        }
    });
}
e5ojs_init();

function e5ojs_global_data_generate(req) {
    // get global info
    e5ojs_global_data.e5ojs_base_url = req.protocol+"://"+req.get('host');
    e5ojs_global_data.e5ojs_current_url = req.protocol+"://"+req.get('host')+req.originalUrl;
    e5ojs_global_data.e5ojs_media_url = req.protocol+"://"+req.get('host')+"/uploads/";
    e5ojs_global_data.e5ojs_media_url_sizes = req.protocol+"://"+req.get('host')+"/uploads/sizes/";
    e5ojs_global_data.e5ojs_all_media_url = req.protocol+"://"+req.get('host')+"/admin/all-media/";
    e5ojs_global_data.e5ojs_default_media_url = req.protocol+"://"+req.get('host')+"/back-end/assets/default-post-img.png";
    e5ojs_global_data.e5ojs_post_status = new Array('publish','pending','trash');
    e5ojs_global_data.e5ojs_current_date = date_format(current_date,'dd-mm-yyyy');

    
    //e5ojs_global_data.e5ojs_current_post_type = "admin/";
    e5ojs_global_data.e5ojs_admin_page_url = {
        dashboard: {title:"dashboard",url:req.protocol+"://"+req.get('host')+"/admin/", icon_name:"dashboard"},
        pages: {title:"pages",url:req.protocol+"://"+req.get('host')+"/admin/pages/", icon_name:"filter_none"},
    };
    // loop for post types
    for( var key in e5ojs_global_data.e5ojs_post_types ) {
        var post_type = e5ojs_global_data.e5ojs_post_types[key];
        e5ojs_global_data.e5ojs_admin_page_url[post_type.post_type_name] = {post_type_id:post_type.post_type_id,title:post_type.post_type_title,url:req.protocol+"://"+req.get('host')+"/admin/post-type/"+post_type.post_type_name+"/", icon_name:"insert_drive_file"};
    }
    e5ojs_global_data.e5ojs_admin_page_url['media'] = {title:"media",url:req.protocol+"://"+req.get('host')+"/admin/media/", icon_name:"collections"};
    e5ojs_global_data.e5ojs_admin_page_url['post_type'] = {title:"post types",url:req.protocol+"://"+req.get('host')+"/admin/post-type/", icon_name:"settings"};
    e5ojs_global_data.e5ojs_admin_page_url['settings'] = {title:"settings",url:req.protocol+"://"+req.get('host')+"/admin/settings/", icon_name:"settings"};


    e5ojs_global_data.e5ojs_admin_action_url = {
        logout : req.protocol+"://"+req.get('host')+"/admin/log-out/",
        post_type_new_post: "action/new-post/",
        post_type_edit_post: "action/edit-post/",// pass the /post_id/ : /23/ or /post_id/status/ : /23/publish/
        post_type_post_bulk_action: "action/",// pass /status/post_ids/ : /publish/23,1,23,4
    };
    e5ojs_global_data.e5ojs_api_get_url = {
        get_all_media: req.protocol+"://"+req.get('host')+"/admin/all-media/",
    }
    console.log(" =========== e5ojs_global_data =========== ",e5ojs_global_data);
}
/* end global data var */








/* start parse upload request files */
var multer = require('multer');
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
        if( file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg' ) {
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
                    result_data.media_file_name = e5ojs_global_data.e5ojs_media_url+result_data.media_file_name;
                    // get image data and send as part of req and get it on router function
                    req.e5ojs_file_validation_error = false;
                    req.e5ojs_file_data = result_data; // pass data to request
                    return cb(null, true);// save file
                });
            });

        }

    }
}).any();
/* end parse upload request files */


/* start resize image files */
var e5ojs_image_sizes = new Array({width:150,height:150},{width:200,height:200},{width:300,height:150},{width:800,height:200});
var image_sizes_pointer = 0;
var e5ojs_folder_images_sizes = "sizes/";
var e5ojs_sizes_return = {};
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
    var file_size_name = e5ojs_global_data.e5ojs_media_url_sizes+media_file_name+"-"+e5ojs_image_sizes[image_sizes_pointer].width+"x"+e5ojs_image_sizes[image_sizes_pointer].height+"."+file_ext;
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








// FROM: http://www.mongodb.org/display/DOCS/Updating#Updating-update%28%29
//
// db.collection.update( criteria, objNew, upsert, multi )
//   criteria - query which selects the record to update;
//   objNew - updated object or $ operators (e.g., $inc) which manipulate the object
//   upsert - if this should be an "upsert"; that is, if the record does not exist, insert it
//   multi - if all documents matching criteria should be updated
//
// db.myCollection.update({condField: 'condValue'}, { $set: { dateField: new Date(2011, 0, 1)}}, false, true);









/* start post type routers */
function e5ojs_add_post_type_router(post_type_data) {
    // start routers
    router.get('/post-type/'+post_type_data.post_type_name+'/', function(req, res, next) {
        // redirect to post/all
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/post-type/"+post_type_data.post_type_name+"/all/");
        });
    });
    router.get('/post-type/'+post_type_data.post_type_name+'/:post_status/', function(req, res, next) {
        /*
        get all posts with status passed in URL example: posts/post_status or all will be all status
        http://nodejs.dev/admin/posts/all/
        */

        // get page with validate session
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // get post type id
            var post_post_type_id = e5ojs_global_data.e5ojs_admin_page_url[e5ojs_global_data.e5ojs_current_post_type].post_type_id;
            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default

            // put here the query post
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
            var limit_post = 12;
            var skip_posts = 0;
            var total_pages = 0;
            var current_page = 1;
            var total_post = 0;
            // total pages
            db.e5ojs_post.find({'post_status':{$in:post_status_array},'post_post_type_id':post_post_type_id}).sort({'post_date':-1}).count(function(q_req, q_res, q_next){
                total_post = parseInt(q_res);
                total_pages = parseInt(total_post/limit_post);
            });
            // query with skip page
            db.e5ojs_post.find({'post_status':{$in:post_status_array},'post_post_type_id':post_post_type_id}).sort({'post_date':-1}).skip(skip_posts).limit(limit_post, function(err, posts){
                // check if has message session
                // get session message
                var e5ojs_message = e5ojs_get_session_message(req);
                // remove session message
                e5ojs_clear_session_message(req);
                // validate error
                res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, e5ojs_message:e5ojs_message, post_status:post_status });
            });
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
            // get post type id
            var post_post_type_id = e5ojs_global_data.e5ojs_admin_page_url[e5ojs_global_data.e5ojs_current_post_type].post_type_id;
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
            });
            // query with skip page
            db.e5ojs_post.find({'post_status':{$in:post_status_array},'post_post_type_id':post_post_type_id}).sort({"post_date":-1}).skip(skip_posts).limit(limit_post, function(err, posts){
                // check if has message session
                // get session message
                var e5ojs_message = e5ojs_get_session_message(req);
                // remove session message
                e5ojs_clear_session_message(req);
                // validate error
                res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, e5ojs_message:e5ojs_message, post_status:post_status });
                //res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.result_data, result_query_db:1, result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, post_status:post_status });
            });
        });
    });
    router.get('/post-type/'+post_type_data.post_type_name+'/action/new-post/', function(req, res, next) {
        /*
        get template for add new post
        */
        // get page with validate session
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default
            res.render('back-end/e5ojs-admin-new-post', { title: 'NEW POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
        });
    });
    router.get('/post-type/'+post_type_data.post_type_name+'/action/edit-post/:post_id/', function(req, res, next) {
        /*
        get template with post data it will be edited
        */
        // get post data to show and edit
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // return template with user data
            // e5ojs_global_data  and e5ojs_user_data default

            // show post data
            var post_id = req.params.post_id; // get url parm post_id
            // get post data with id
            e5ojs_get_post(post_id,function(post_data){
                // validate error
                // check if has message session
                // get session message
                var e5ojs_message = e5ojs_get_session_message(req);
                // remove session message
                e5ojs_clear_session_message(req);
                var post_data_object = post_data[0];
                // validate post_media_attachment
                if( post_data_object.post_media_attachment.length ) {
                    // get image from DB
                    e5ojs_get_media(parseInt(post_data_object.post_media_attachment),function(media_result){
                        if( media_result == false ) {
                            post_data_object.post_media_attachment_id = "";
                            post_data_object.post_media_attachment_url = e5ojs_global_data.e5ojs_default_media_url;
                        } else {
                            var media_url = e5ojs_global_data.e5ojs_media_url_sizes+media_result[0].media_file_name_clean+"-800x200."+(media_result[0].media_mime_type.split("/"))[1];
                            post_data_object.post_media_attachment_id = media_result[0].media_id;
                            post_data_object.post_media_attachment_url = media_url;
                        }
                        // render with post data
                        res.render('back-end/e5ojs-admin-edit-post', { title: 'EDIT POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:post_data_object, e5ojs_message:e5ojs_message });
                    });
                } else {
                    // no media id
                    post_data_object.post_media_attachment_id = "";
                    post_data_object.post_media_attachment_url = e5ojs_global_data.e5ojs_default_media_url;
                    // render with post data
                    res.render('back-end/e5ojs-admin-edit-post', { title: 'EDIT POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:post_data_object, e5ojs_message:e5ojs_message });
                }
            });

        });

    });
    router.post('/post-type/'+post_type_data.post_type_name+'/action/edit-post/:post_id/:post_status', function(req, res, next) {
        /*
        update post data with post id and post status passed by URL
        */
        // update post data
        // get page with validate session
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // get post type id
            var post_post_type_id = e5ojs_global_data.e5ojs_admin_page_url[e5ojs_global_data.e5ojs_current_post_type].post_type_id;
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
            var post_name = getSlug(remove_diacritics(post_name));
            e5ojs_update_post( {post_id:parseInt(post_id),post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_media_attachment:post_media_attachment,post_status:post_status,post_post_type_id:post_post_type_id},function(result_data){
                // validate result

                // create session message
                var e5ojs_message = null;
                // show notification
                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post edited'};
                // save message on session var
                e5ojs_push_session_message(req,e5ojs_message);

                // redirect to edit post with ID
                res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/post-type/"+post_type_data.post_type_name+"/action/edit-post/"+result_data.post_id);
            });
        });
    });
    router.post('/post-type/'+post_type_data.post_type_name+'/action/new-post/:post_status', function(req, res, next) {
        /*
        insert a new post with post status passed by URL
        */
        // get page with validate session
        e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // get post type id
            var post_post_type_id = e5ojs_global_data.e5ojs_admin_page_url[e5ojs_global_data.e5ojs_current_post_type].post_type_id;

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
                    res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/post-type/"+post_type_data.post_type_name+"/action/edit-post/"+result_data.post_id);
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
                res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/post-type/"+post_type_data.post_type_name+"/all/");
            });
        });
    });
}
/* end post type routers */























/* start login session */
router.get('/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin', { title: 'DASHBOARD', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.post('/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin', { title: 'DASHBOARD', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.get('/admin/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin', { title: 'DASHBOARD', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.get('/log-out/', function(req, res, next) {
    e5ojs_global_data_generate(req);
    // clear session data
    var e5ojs_session = req.session;
    e5ojs_session.e5ojs_user_data = null;
    e5ojs_session.destroy();
    // return log-in page
    res.render('back-end/e5ojs-login', { title: 'E5OJS - LOGIN', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:null });
});
/* start login session */
















/* start media upload */
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
/* end media upload */

















/* start admin pages */
router.get('/pages/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin-pages', { title: 'PAGES', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.get('/media/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin-media', { title: 'MEDIA', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});
router.get('/settings/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        res.render('back-end/e5ojs-admin-settings', { title: 'SETTINGS', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
    });
});




















/* ============== start e5ojs post functions =============== */
//
// router.get('/posts/', function(req, res, next) {
//     // redirect to post/all
//     e5ojs_validate_admin_session_callback(req, res, function(user_data) {
//         res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/posts/all/");
//     });
// });
// router.get('/posts/:post_status/', function(req, res, next) {
//     /*
//     get all posts with status passed in URL example: posts/post_status or all will be all status
//     http://nodejs.dev/admin/posts/all/
//     */
//
//     // get page with validate session
//     e5ojs_validate_admin_session_callback(req, res, function(user_data) {
//         // return template with user data
//         // e5ojs_global_data  and e5ojs_user_data default
//
//         // put here the query post
//         // get post status
//         var post_status = req.params.post_status;
//         var post_status_array = Array();
//         if( post_status == "all" ) {
//             post_status_array = Array('publish','pending','trash');
//         } else {
//             if( post_status == 'publish' )
//                 post_status_array.push("publish");
//             if( post_status == 'pending' )
//                 post_status_array.push("pending");
//             if( post_status == 'trash' )
//                 post_status_array.push("trash");
//         }
//
//         // get posts
//         var limit_post = 12;
//         var skip_posts = 0;
//         var total_pages = 0;
//         var current_page = 1;
//         var total_post = 0;
//         // total pages
//         db.e5ojs_post.find({'post_status':{$in:post_status_array}}).sort({'post_date':-1}).count(function(q_req, q_res, q_next){
//             total_post = parseInt(q_res);
//             total_pages = parseInt(total_post/limit_post);
//         });
//         // query with skip page
//         db.e5ojs_post.find({'post_status':{$in:post_status_array}}).sort({'post_date':-1}).skip(skip_posts).limit(limit_post, function(err, posts){
//             // check if has message session
//             // get session message
//             var e5ojs_message = e5ojs_get_session_message(req);
//             // remove session message
//             e5ojs_clear_session_message(req);
//             // validate error
//             res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, e5ojs_message:e5ojs_message, post_status:post_status });
//         });
//     });
// });
//
// router.get('/posts/:post_status/page/:page/', function(req, res, next) {
//     /*
//     get all posts with post status and paginated
//     */
//
//     // get page with validate session
//     e5ojs_validate_admin_session_callback(req, res, function(user_data) {
//         // return template with user data
//         // e5ojs_global_data  and e5ojs_user_data default
//         // get post status
//         var post_status = req.params.post_status;
//         var post_status_array = Array();
//         if( post_status == "all" ) {
//             post_status_array = Array('publish','pending','trash');
//         } else {
//             if( post_status == 'publish' )
//                 post_status_array.push("publish");
//             if( post_status == 'pending' )
//                 post_status_array.push("pending");
//             if( post_status == 'trash' )
//                 post_status_array.push("trash");
//         }
//
//         // get posts
//         // get total pages
//         var limit_post = 12;
//         var skip_posts = 0;
//         var total_post = 0;
//         if( parseInt(req.params.page) == 1 ) {
//             skip_posts = 0;
//         } else {
//             skip_posts = (parseInt(req.params.page)-1)*limit_post;
//         }
//         var total_pages = 0;
//         var current_page = req.params.page;
//         // total pages
//         db.e5ojs_post.find({'post_status':{$in:post_status_array}}).count(function(q_req, q_res, q_next){
//             total_post = parseInt(q_res);
//             total_pages = parseInt(total_post/limit_post);
//         });
//         // query with skip page
//         db.e5ojs_post.find({'post_status':{$in:post_status_array}}).sort({"post_date":-1}).skip(skip_posts).limit(limit_post, function(err, posts){
//             // check if has message session
//             // get session message
//             var e5ojs_message = e5ojs_get_session_message(req);
//             // remove session message
//             e5ojs_clear_session_message(req);
//             // validate error
//             res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, e5ojs_message:e5ojs_message, post_status:post_status });
//             //res.render('back-end/e5ojs-admin-posts', { title: 'POSTS', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.result_data, result_query_db:1, result_query_data:posts, total_pages:total_pages+1, current_page:current_page, total_post:total_post, post_status:post_status });
//         });
//     });
// });
// router.get('/posts/action/new-post/', function(req, res, next) {
//     /*
//     get template for add new post
//     */
//     // get page with validate session
//     e5ojs_validate_admin_session_callback(req, res, function(user_data) {
//         // return template with user data
//         // e5ojs_global_data  and e5ojs_user_data default
//         res.render('back-end/e5ojs-admin-new-post', { title: 'NEW POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
//     });
// });
// router.get('/posts/action/edit-post/:post_id/', function(req, res, next) {
//     /*
//     get template with post data it will be edited
//     */
//     // get post data to show and edit
//     e5ojs_validate_admin_session_callback(req, res, function(user_data) {
//         // return template with user data
//         // e5ojs_global_data  and e5ojs_user_data default
//
//         // show post data
//         var post_id = req.params.post_id; // get url parm post_id
//         // get post data with id
//         e5ojs_get_post(post_id,function(post_data){
//             // validate error
//             // check if has message session
//             // get session message
//             var e5ojs_message = e5ojs_get_session_message(req);
//             // remove session message
//             e5ojs_clear_session_message(req);
//             var post_data_object = post_data[0];
//             // validate post_media_attachment
//             if( post_data_object.post_media_attachment.length ) {
//                 // get image from DB
//                 e5ojs_get_media(parseInt(post_data_object.post_media_attachment),function(media_result){
//                     if( media_result == false ) {
//                         post_data_object.post_media_attachment_id = "";
//                         post_data_object.post_media_attachment_url = e5ojs_global_data.e5ojs_default_media_url;
//                     } else {
//                         var media_url = e5ojs_global_data.e5ojs_media_url_sizes+media_result[0].media_file_name_clean+"-800x200."+(media_result[0].media_mime_type.split("/"))[1];
//                         post_data_object.post_media_attachment_id = media_result[0].media_id;
//                         post_data_object.post_media_attachment_url = media_url;
//                     }
//                     // render with post data
//                     res.render('back-end/e5ojs-admin-edit-post', { title: 'EDIT POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:post_data_object, e5ojs_message:e5ojs_message });
//                 });
//             } else {
//                 // no media id
//                 post_data_object.post_media_attachment_id = "";
//                 post_data_object.post_media_attachment_url = e5ojs_global_data.e5ojs_default_media_url;
//                 // render with post data
//                 res.render('back-end/e5ojs-admin-edit-post', { title: 'EDIT POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], result_query_data:post_data_object, e5ojs_message:e5ojs_message });
//             }
//         });
//
//     });
//
// });
// router.post('/posts/action/edit-post/:post_id/:post_status', function(req, res, next) {
//     /*
//     update post data with post id and post status passed by URL
//     */
//     // update post data
//     // get page with validate session
//     e5ojs_validate_admin_session_callback(req, res, function(user_data) {
//         // return template with user data
//         // e5ojs_global_data  and e5ojs_user_data default
//
//         // get post status
//         var post_status_req = req.params.post_status; // get url parm post_id
//         var post_status = "publish";
//         // validate post_status
//         if( post_status_req == 'publish' )
//             post_status = "publish";
//         if( post_status_req == 'pending' )
//             post_status = "pending";
//         if( post_status_req == 'trash' )
//             post_status = "trash";
//
//
//         // get post id
//         var post_id = req.params.post_id; // get url parm post_id
//
//         // get post data
//         var post_title = req.body.post_title;
//         var post_content = req.body.post_content;
//         var post_format_date = req.body.post_date;
//         var post_date = req.body.post_date_submit;
//         var post_excerpt = req.body.post_excerpt;
//         var post_media_attachment = req.body.post_media_id;
//
//         // update post on DB
//         // generate post name
//         var post_name = post_title.replace(/\s+/g, '-').toLowerCase();
//         var post_name = getSlug(remove_diacritics(post_name));
//         e5ojs_update_post( {post_id:parseInt(post_id),post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_media_attachment:post_media_attachment,post_status:post_status},function(result_data){
//             // validate result
//
//             // create session message
//             var e5ojs_message = null;
//             // show notification
//             e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post edited'};
//             // save message on session var
//             e5ojs_push_session_message(req,e5ojs_message);
//
//             // redirect to edit post with ID
//             res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/posts/action/edit-post/"+result_data.post_id);
//         });
//     });
// });
// router.post('/posts/action/new-post/:post_status', function(req, res, next) {
//     /*
//     insert a new post with post status passed by URL
//     */
//     // get page with validate session
//     e5ojs_validate_admin_session_callback(req, res, function(user_data) {
//         // return template with user data
//         // e5ojs_global_data  and e5ojs_user_data default
//         //res.render('back-end/e5ojs-admin-new-post', { title: 'NEW POST', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0] });
//
//         // save post data
//         // get post status
//         var post_status_req = req.params.post_status; // get url parm post_id
//         var post_status = "publish";
//         // validate post_status
//         if( post_status_req == 'publish' )
//             post_status = "publish";
//         if( post_status_req == 'pending' )
//             post_status = "pending";
//         if( post_status_req == 'trash' )
//             post_status = "trash";
//
//         // get post data
//         var post_title = req.body.post_title;
//         var post_content = req.body.post_content;
//         var post_format_date = req.body.post_date;
//         var post_date = req.body.post_date_submit;
//         var post_excerpt = req.body.post_excerpt;
//         var post_media_attachment = req.body.post_media_id;
//
//         // save new post on DB
//         //db.e5ojs_post.insert({post_id:});
//         e5ojs_get_next_id('post',function(data){
//             var next_id = data.seq;
//             // insert post data
//             var post_name = post_title.replace(/\s+/g, '-').toLowerCase();
//             var post_name = getSlug(remove_diacritics(post_name));
//             e5ojs_insert_new_post({post_id:next_id,post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_media_attachment:post_media_attachment,post_status:post_status},function(result_data){
//                 // validate result
//                 // create session message
//                 var e5ojs_message = null;
//                 // show notification
//                 e5ojs_message = {'status':1,'type':'done','text':'Successfully - New post created'};
//                 // save message on session var
//                 e5ojs_push_session_message(req,e5ojs_message);
//                 // redirect to edit post with ID
//                 res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/posts/action/edit-post/"+result_data.post_id);
//             });
//         });
//     });
// });
// router.get('/posts/action/:post_status/:post_id/', function(req, res, next) {
//     /*
//     update one choose post status from multiple posts ids
//     only change post status passed from url example: post_status/post_id
//     http://nodejs.dev/admin/posts/action/delete/79
//     */
//
//     // change post status to dynamically
//     // get page with validate session
//     e5ojs_validate_admin_session_callback(req, res, function(user_data) {
//         // return template with user data
//         // e5ojs_global_data  and e5ojs_user_data default
//         // get action
//         var request_action = req.params.post_status;
//         // get post id param
//         var post_id = req.params.post_id; // get url parm post_id
//         // check if has multiples ids
//         var post_ids = post_id.split(",");
//
//         // validate post status
//         var post_set_status = "pending";
//         if( request_action == "publish" ) {
//             post_set_status = "publish";
//         } else if( request_action == "pending" ) {
//             post_set_status = "pending";
//         } else if( request_action == "delete" ) {
//             post_set_status = "trash";
//         }
//         //console.log("post_set_status : ",post_set_status);
//         // multiple post ids
//         // update posts
//         e5ojs_change_post_status_multiple(post_ids,post_set_status,function(data){
//             // create session message
//             // validate result
//             var e5ojs_message = null;
//             if( data.status ) {
//                 // show notification
//                 e5ojs_message = {'status':1,'type':'done','text':'Successfully - Moved to '+post_set_status};
//             } else {
//                 e5ojs_message = {'status':1,'type':'error','text':'Error - Tried to move to '+post_set_status};
//             }
//             // save message on session var
//             e5ojs_push_session_message(req,e5ojs_message);
//             // redirect to posts archive
//             res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/posts/all/");
//         });
//     });
// });

/* ============== end e5ojs post functions =============== */


















/* ============== start e5ojs post type functions =============== */

router.get('/post-type/', function(req, res, next) {
    // get page with validate session
    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        // request for all posts types on DB
        e5ojs_post_type_get_all(function(post_types){
            // get session message
            var e5ojs_message = e5ojs_get_session_message(req);
            // remove session message
            e5ojs_clear_session_message(req);
            // render post type page
            res.render('back-end/e5ojs-admin-post-type', { title: 'POST TYPE', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:user_data.e5ojs_user_data[0], e5ojs_message:e5ojs_message, post_types:post_types });
        });
    });
});
router.post('/post-type/action/:post_type_action/', function(req, res, next) {

    e5ojs_validate_admin_session_callback(req, res, function(user_data) {
        // return template with user data
        // e5ojs_global_data  and e5ojs_user_data default
        // get page with validate session
        var post_type_action = req.params.post_type_action;
        var post_type_title = req.body.post_type_title;
        var post_type_name = req.body.post_type_name;
        var post_type_description = req.body.post_type_description;
        var post_type_slug = getSlug(remove_diacritics( post_type_name ));
        // save new post type
        e5ojs_post_type_insert_new({'post_type_id':'','post_type_title':post_type_title,'post_type_name':post_type_name,'post_type_description':post_type_description,'post_type_slug':post_type_slug},function(post_type_data){
            // create session message
            var e5ojs_message = null;
            // show notification
            e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post Type created'};
            // save message on session var
            e5ojs_push_session_message(req,e5ojs_message);
            // redirect to de same page
            res.redirect(e5ojs_global_data.e5ojs_base_url+"/admin/post-type/");
        });
    });
});

/* ============== end e5ojs post type functions =============== */


/* end admin pages */





















/* ============== start e5ojs session functions =============== */
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
/* ============== end e5ojs session functions =============== */






















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
function e5ojs_get_media(media_id,callback) {
    db.e5ojs_media.find({'media_id':media_id},function(err, media_data){
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
    db.e5ojs_post_type.find({},function(err,result_data){
        callback(result_data);
    });
}
function e5ojs_post_type_insert_new(post_type_data,callback) {
    // get increment e5ojs_media
    e5ojs_get_next_id('post_type',function(data){
        // increment post_type counter
        var next_id = data.seq;
        post_type_data.post_type_id = next_id;
        db.e5ojs_post_type.insert(post_type_data,function(err, result_data){
            e5ojs_init();
            callback(result_data);
        });
    });
}
/* end post type DB function */
/* ============== end e5ojs mongodb functions =============== */
























/* ============== start e5ojs validate session functions =============== */

function e5ojs_validate_admin_session_callback(req, res, callback) {
    e5ojs_global_data_generate(req);
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
            //console.log("e5ojs_validate_admin_session_callback",user_data);
            if( user_data.result_login ) {
                // user credentials are ok
                // save user data on session var
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = user_data.e5ojs_user_data[0];
                // return status and user info
                callback(user_data);
            } else {
                // user not found or user credentials not match
                // clear session data
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                // render login page
                res.render('back-end/e5ojs-login', { title: 'E5OJS - LOGIN', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:null });
            }
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
                    // return status and user info
                    callback(user_data);
                } else {
                    // user not found or user credentials not match
                    // clear session data
                    var e5ojs_session = req.session;
                    e5ojs_session.e5ojs_user_data = null;
                    e5ojs_session.destroy();
                    // render login page
                    res.render('back-end/e5ojs-login', { title: 'E5OJS - LOGIN', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:null });
                }
            });
        } else {
            // clear session
            var e5ojs_session = req.session;
            e5ojs_session.e5ojs_user_data = null;
            e5ojs_session.destroy();
            // render login page
            res.render('back-end/e5ojs-login', { title: 'E5OJS - LOGIN', e5ojs_global_data:e5ojs_global_data, e5ojs_user_data:null });
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















module.exports = router;
