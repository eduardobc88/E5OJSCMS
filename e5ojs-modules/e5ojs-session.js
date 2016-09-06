'use strict';
var file_name = "e5ojs-session.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require('../e5ojs-config/e5ojs-config.js');
var e5ojs_media = require('../e5ojs-modules/e5ojs-media.js');
// e5ojs end local requires settings


// MD5
var md5 = require('md5');
// mongodb
var e5ojs_db = require('../e5ojs-config/e5ojs-mongodb.js');


// get global data from config
var e5ojs_global_data = e5ojs_config.e5ojs_global_data;



















/* ============== start e5ojs validate session functions =============== */

exports.e5ojs_validate_admin_session_callback = function e5ojs_validate_admin_session_callback(req, res, callback) {
    // get session vars
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_user_data !== 'undefined' && e5ojs_session.e5ojs_user_data != null ) {
        // session vars exists
        // get session user data
        var user_login = e5ojs_session.e5ojs_user_data.user_login;
        var user_pass = e5ojs_session.e5ojs_user_data.user_pass;
        // ask to DB for this user credentials
        e5ojs_get_user_info_callback(user_login,user_pass,false,function(user_data){
            // validate request user db result
            // get menu data as post types data routers
            //e5ojs_global_data_init(); // init global object data

            // pass this to the back-end file
            //e5ojs_init(function(){
                if( user_data.result_login ) {
                    // user credentials are ok
                    // save user data on session var
                    var e5ojs_session = req.session;
                    e5ojs_session.e5ojs_user_data = user_data.e5ojs_user_data[0];

                    user_data.e5ojs_user_data[0].user_avatar_url = e5ojs_global_data.admin_res.assets_url+"default-profile-image.jpg";
                    user_data.e5ojs_user_data[0].user_bkg_url = e5ojs_global_data.admin_res.assets_url+"profile-menu.jpg";
                    // return status and user info
                    // get user avatar and wallpaper
                    var user_avatar_media_id = e5ojs_session.e5ojs_user_data.user_avatar_media_id;
                    var user_bkg_media_id = e5ojs_session.e5ojs_user_data.user_bkg_media_id;
                    e5ojs_media.e5ojs_media_api_get_media([user_avatar_media_id,user_bkg_media_id], function(media_data_result){
                        for( var media_key in media_data_result ) {
                            if( user_avatar_media_id == media_data_result[media_key].media_id ) {
                                var ext = media_data_result[media_key].media_mime_type.split("/");
                                user_data.e5ojs_user_data[0].user_avatar_url = e5ojs_global_data.admin_res.media_uploads_sizes_url+media_data_result[media_key].media_file_name_clean+"-150x150."+ext[1];
                            }
                            if( user_bkg_media_id == media_data_result[media_key].media_id ) {
                                var ext = media_data_result[media_key].media_mime_type.split("/");
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
            //});



        });
    } else {
        // session vars does not exists
        // check for post vars
        var user_login = req.body.user_login;
        var user_pass = req.body.user_pass;
        // validate for empty vars on body = {}
        if( req.body != null ) {
            // ask to DB for this user credentials
            e5ojs_get_user_info_callback(user_login,user_pass,true,function(user_data){
                // validate request user db result
                if( user_data.result_login ) {
                    // user credentials are ok
                    // save user data on session var
                    var e5ojs_session = req.session;
                    e5ojs_session.e5ojs_user_data = user_data.e5ojs_user_data[0];

                    user_data.e5ojs_user_data[0].user_avatar_url = e5ojs_global_data.admin_res.assets_url+"default-profile-image.jpg";
                    user_data.e5ojs_user_data[0].user_bkg_url = e5ojs_global_data.admin_res.assets_url+"profile-menu.jpg";
                    // return status and user info
                    // get user avatar and wallpaper
                    var user_avatar_media_id = e5ojs_session.e5ojs_user_data.user_avatar_media_id;
                    var user_bkg_media_id = e5ojs_session.e5ojs_user_data.user_bkg_media_id;
                    e5ojs_media.e5ojs_media_api_get_media([user_avatar_media_id,user_bkg_media_id], function(media_data_result){
                        for( var media_key in media_data_result ) {
                            if( user_avatar_media_id == media_data_result[media_key].media_id ) {
                                var ext = media_data_result[media_key].media_mime_type.split("/");
                                user_data.e5ojs_user_data[0].user_avatar_url = e5ojs_global_data.admin_res.media_uploads_sizes_url+media_data_result[media_key].media_file_name_clean+"-150x150."+ext[1];
                            }
                            if( user_bkg_media_id == media_data_result[media_key].media_id ) {
                                var ext = media_data_result[media_key].media_mime_type.split("/");
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
    e5ojs_db.e5ojs_user.find({'user_login':user_login,'user_pass':user_pass}, function(err, user){
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
