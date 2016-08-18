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
