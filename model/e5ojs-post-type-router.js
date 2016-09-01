'use strict';
var file_name = "e5ojs-post-type-router.js";
console.log(file_name,"Module loaded...");


// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config.js");
var e5ojs_session = require('../model/e5ojs-session.js');
var e5ojs_session_message = require('../model/e5ojs-session-message.js');
var e5ojs_base_pagination = require('../model/e5ojs-pagination.js');
var e5ojs_counter = require('../model/e5ojs-counter.js');
var e5ojs_post = require('../model/e5ojs-post.js');
var e5ojs_post_type = require('../model/e5ojs-post-type.js');
var e5ojs_post_meta = require('../model/e5ojs-post-meta.js');
var e5ojs_media = require('../model/e5ojs-media.js');
// e5ojs end local requires settings




// MD5
var md5 = require('md5');
// mongodb
var e5ojs_db = require('../config/e5ojs-mongodb.js');
// generate slug from string
var getSlug = require('speakingurl');
// remove diacritics
var remove_diacritics = require('diacritics').remove;





// init vars
var e5ojs_global_data = e5ojs_config.e5ojs_global_data;
var router = e5ojs_config.e5ojs_router;






/* start e5ojs post type routers */

exports.e5ojs_add_post_type_router = function e5ojs_add_post_type_router(post_type_data) {
    // start routers
    router.get('/post-type/'+post_type_data.post_type_name+'/', function(req, res, next) {
        // redirect to post/all
        e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type_data.post_type_name+"/all/page/1/");
        });
    });
    router.get('/post-type/'+post_type_data.post_type_name+'/:post_status/page/:page/', function(req, res, next) {
        /*
        get all posts with post status and paginated
        */

        // get page with validate session
        e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
            e5ojs_db.e5ojs_post.find({'post_status':{$in:post_status_array},'post_post_type_id':post_post_type_id}).count(function(q_req, q_res, q_next){
                total_post = parseInt(q_res);
                total_pages = parseInt(total_post/limit_post);
                total_pages = (( total_pages == 0 )?1:parseInt(total_pages)+((parseInt(total_post%limit_post) > 0)?2:1));
            });
            // query with skip page
            e5ojs_db.e5ojs_post.find({'post_status':{$in:post_status_array},'post_post_type_id':post_post_type_id}).sort({'post_date':-1,'post_id':-1}).skip(skip_posts).limit(limit_post, function(err, posts){
                // get pagination
                var e5ojs_pagination = e5ojs_base_pagination.e5ojs_get_pagination(total_pages,current_page,total_post,post_type_info.url+post_status+"/");
                // check if has message session
                // get session message
                var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
                // remove session message
                e5ojs_session_message.e5ojs_clear_session_message(req);
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
        e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
        e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
            // set current page
            e5ojs_global_data.e5ojs_current_post_type = post_type_data.post_type_name;
            // get post type data

            e5ojs_post_type.e5ojs_post_type_get_by_name(e5ojs_global_data.e5ojs_current_post_type,function(post_type_data){
                var post_type_meta = [];
                if( post_type_data != null) {
                    post_type_meta = post_type_data[0].post_type_meta;
                }
                // return template with user data
                // e5ojs_global_data  and e5ojs_user_data default

                // show post data
                var post_id = req.params.post_id; // get url parm post_id

                // get post meta
                e5ojs_post_meta.e5ojs_get_post_meta(post_id,function(current_post_meta){
                    //console.log("current_post_meta_saved",current_post_meta_saved);
                    // math metas
                    // remove meta saved diffrerent to post type meta name
                    var post_meta_data = [];
                    for( var key_meta in post_type_meta ) {
                        var find = 0;
                        for( var key_current_meta in current_post_meta ) {
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
                    e5ojs_post.e5ojs_get_post(post_id,function(post_data){
                        // validate error

                        // check if has message session
                        // get session message
                        var e5ojs_message = e5ojs_session_message.e5ojs_get_session_message(req);
                        // remove session message
                        e5ojs_session_message.e5ojs_clear_session_message(req);
                        var post_data_object = post_data[0];
                        // add post_type_meta to post_data
                        post_data_object.post_type_meta = post_meta_data;
                        // validate post_media_attachment
                        if( post_data_object.post_media_attachment.length ) {
                            // get image from DB
                            e5ojs_media.e5ojs_get_media(post_data_object.post_media_attachment,function(media_result){
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
        e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
            for( var element_key in req.body ) {
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
            e5ojs_post_type.e5ojs_post_type_get_by_id(post_post_type_id,function(post_type_data_result){
                if( post_type_data_result != null ) {
                    var post_type_meta = post_type_data_result[0].post_type_meta;
                    if( post_type_meta.length ) {
                        if( post_type_meta.length ) {
                            // the post meta has metas
                            // math request meta and post type meta
                            for( var meta_key in post_type_meta ) {
                                var meta_name = post_type_meta[meta_key].meta_name;
                                // search meta_name on post_meta
                                for( var post_meta_key in post_meta ) {
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
                e5ojs_post_meta.e5ojs_get_post_meta(post_id,function(current_post_meta_saved){
                    if( current_post_meta_saved != null && current_post_meta_saved.length > 0 ) {
                        // math post metas
                        // current meta
                        for( var current_meta_key in current_post_meta_saved ) {
                            current_meta = current_post_meta_saved[current_meta_key];
                            // meta save
                            for( var meta_save_key in post_meta_save ) {
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
                    e5ojs_post_meta.e5ojs_update_post_meta(post_meta_update,function(update_post_meta_result){
                        //console.log("update_post_meta_result",update_post_meta_result);
                        // insert post meta on DB
                        e5ojs_post_meta.e5ojs_insert_post_meta(post_meta_save,function(insert_post_meta_result){
                            //console.log("insert_post_meta_result",insert_post_meta_result);
                            // update post
                            e5ojs_post.e5ojs_update_post( {post_id:parseInt(post_id),post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_media_attachment:post_media_attachment,post_status:post_status,post_post_type_id:post_post_type_id},function(result_data){
                                // validate result
                                // create session message
                                var e5ojs_message = null;
                                // show notification
                                e5ojs_message = {'status':1,'type':'done','text':'Successfully - Post edited'};
                                // save message on session var
                                e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
                                // set true for front-end refresh routers
                                e5ojs_config.e5ojs_refresh_router = true;
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
        e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
            //e5ojs_db.e5ojs_post.insert({post_id:});
            e5ojs_counter.e5ojs_get_next_id('post',function(data){
                var next_id = data.seq;
                // insert post data
                var post_name = post_title.replace(/\s+/g, '-').toLowerCase();
                //var post_name = getSlug(remove_diacritics(e5ojs_global_data.e5ojs_current_post_type))+"/"+getSlug(remove_diacritics(post_name));
                var post_name = getSlug(remove_diacritics(post_name));
                e5ojs_post.e5ojs_insert_new_post({post_id:next_id,post_title:post_title,post_content:post_content,post_excerpt:post_excerpt,post_date:post_date,post_name:post_name,post_media_attachment:post_media_attachment,post_status:post_status,post_post_type_id:post_post_type_id},function(result_data){
                    // validate result
                    // create session message
                    var e5ojs_message = null;
                    // show notification
                    e5ojs_message = {'status':1,'type':'done','text':'Successfully - New post created'};
                    // save message on session var
                    e5ojs_session_message.e5ojs_push_session_message(req,e5ojs_message);
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
        e5ojs_session.e5ojs_validate_admin_session_callback(req, res, function(user_data) {
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
                e5ojs_post.e5ojs_delete_post_status_multiple(post_ids,function(data){
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
                    // redirect to posts archive
                    res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type_data.post_type_name+"/all/page/1/");
                });
            } else {
                //console.log("post_set_status : ",post_set_status);
                // multiple post ids
                // update posts
                e5ojs_post.e5ojs_change_post_status_multiple(post_ids,post_set_status,function(data){
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
                    // redirect to posts archive
                    res.redirect(e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type_data.post_type_name+"/all/page/1/");
                });
            }

        });
    });
}

/*  end e5ojs post type routers  */
