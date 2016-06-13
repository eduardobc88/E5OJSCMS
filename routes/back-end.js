var express = require('express');
var router = express.Router();
// MD5
//var md5 = require('md5');
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
var e5ojs_global_data = {
    'e5ojs_base_url':'',
    'e5ojs_current_url':'',
    'e5ojs_current_date':date_format(current_date,'dd-mm-yyyy')
};
function e5ojs_global_data_generate(req) {

    // outputs hello world
    e5ojs_global_data.e5ojs_base_url = req.protocol+"://"+req.get('host');
    e5ojs_global_data.e5ojs_current_url = req.protocol+"://"+req.get('host')+req.originalUrl;
    e5ojs_global_data.e5ojs_media_url = req.protocol+"://"+req.get('host')+"/uploads/";
    e5ojs_global_data.e5ojs_media_url_sizes = req.protocol+"://"+req.get('host')+"/uploads/sizes/";
    e5ojs_global_data.e5ojs_all_media_url = req.protocol+"://"+req.get('host')+"/admin/all-media/";
    console.log("e5ojs_global_data : ",e5ojs_global_data);
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
      var file_name_strip = getSlug(remove_diacritics( (file.originalname.split("."))[0] ));
      var file_original_name = file.originalname;
      var file_mime_type = file.mimetype;
      var file_store_name = file.filename;
      var file_size = file.size;
      var file_ext = file_mime_type.split("/");
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







/* start media upload */
router.post('/upload/', function(req, res, next) {
    // get page with validate session
    e5ojs_global_data_generate(req);

    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // exists vars
        var user_name = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        e5ojs_validate_admin_session_db_callback(user_name,user_pass,req,res,next,function(user_data){
            if( user_data.result_login ) {
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
            } else {
                // clear session data
                var e5ojs_session = req.session;
                e5ojs_session.e5ojs_user_data = null;
                e5ojs_session.destroy();
                // return log-in page
                res.json({"upload":false});
            }
        });
    } else {
        // doesn´t exists vars
        // clear session data
        var e5ojs_session = req.session;
        e5ojs_session.e5ojs_user_data = null;
        e5ojs_session.destroy();
        // return log-in page
        res.json({"upload":false});
    }

});
// get all media return json
router.get('/all-media/',function(req, res, next){
    // validate session
    e5ojs_global_data_generate(req);

    e5ojs_get_all_media(function(media_data){
        if( media_data != false ) {
            var media_sizes = {};
            e5ojs_image_sizes.forEach(function(size,key){
                var size_key = size.width+"x"+size.height;
                media_sizes[size_key] = size_key;
            });
            res.json( new Array({status:true,media_posts:media_data,sizes:media_sizes}) );
        } else {
            res.json({status:false});
        }
    });
});
/* end media upload */












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
    console.log("post_id",req.params);
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
                    var post_data_object = post_data[0];
                    // validate post_media_attachment
                    if( typeof post_data_object.post_media_attachment !== 'undefined' && post_data_object.post_media_attachment != null ) {
                        post_data_object.post_media_attachment_id = "";
                        post_data_object.post_media_attachment = "https://placeholdit.imgix.net/~text?txtsize=50&bg=818181&txtclr=FFFFFF&txt=IMAGE&w=800&h=150&txttrack=0";
                        // render with post data
                        res.render('back-end/e5ojs-admin-edit-post', { title: "EDIT POST", e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data, result_query_data:post_data_object, e5ojs_message:e5ojs_message });
                    } else {
                        // get image from DB
                        e5ojs_get_media(parseInt(post_data_object.post_media_attachment),function(media_result){
                            console.log("media_result",media_result);
                            if( !media_result ) {
                                post_data_object.post_media_attachment_id = "";
                                post_data_object.post_media_attachment = "https://placeholdit.imgix.net/~text?txtsize=50&bg=818181&txtclr=FFFFFF&txt=IMAGE&w=800&h=150&txttrack=0";
                            } else {
                                var media_url = e5ojs_global_data.e5ojs_media_url_sizes+media_result[0].media_file_name_clean+"-800x200."+(media_result[0].media_mime_type.split("/"))[1];
                                post_data_object.post_media_attachment_id = media_result[0].media_id;
                                post_data_object.post_media_attachment_url = media_url;
                            }
                            // render with post data
                            res.render('back-end/e5ojs-admin-edit-post', { title: "EDIT POST", e5ojs_global_data:e5ojs_global_data, result_data:user_data.result_data, result_query_data:post_data_object, e5ojs_message:e5ojs_message });
                        });

                    }

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
    var post_media_attachment = req.body.post_media_id;

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
                var post_name = getSlug(remove_diacritics(post_name));
                e5ojs_update_post( {post_id:parseInt(post_id),post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_media_attachment:post_media_attachment,post_status:post_status},function(result_data){
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
    var post_media_attachment = req.body.post_media_id;

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
                    var post_name = getSlug(remove_diacritics(post_name));
                    e5ojs_insert_new_post({post_id:next_id,post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_media_attachment:post_media_attachment,post_status:post_status},function(result_data){
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
