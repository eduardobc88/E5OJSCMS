'use strict';
var file_name = "e5ojs-init.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config.js");
var e5ojs_settings = require('../model/e5ojs-settings.js');
var e5ojs_post_type = require('../model/e5ojs-post-type.js');
var e5ojs_post_type_router = require('../model/e5ojs-post-type-router.js');
// e5ojs end local requires settings


// mongodb
//var e5ojs_db = require('../config/e5ojs-mongodb.js');




// init vars
var e5ojs_global_data = e5ojs_config.e5ojs_global_data;



/* ============== start e5ojs configuration ============== */
var e5ojs_init = function e5ojs_init(callback) {
    // load all post types
    e5ojs_global_data.admin_pages.admin_post_types = new Array();
    e5ojs_post_type.e5ojs_post_type_get_all(function(post_types){
        // fix post type info
        for( var post_type_key in post_types ) {
            var post_type = post_types[post_type_key];
            e5ojs_global_data.admin_pages.admin_post_types[post_type.post_type_name] = {post_type_id:post_type.post_type_id,title:post_type.post_type_title,description:post_type.post_type_description,url:e5ojs_global_data.admin_res.base_url+"/admin/post-type/"+post_type.post_type_name+"/", icon_name:"insert_drive_file"};
        }
        // set router for each post type
        for( var key in post_types ) {
            var post_type = post_types[key];
            e5ojs_post_type_router.e5ojs_add_post_type_router(post_type);
        }
        callback();
    });
}
exports.e5ojs_init = e5ojs_init;


var e5ojs_global_data_init = function e5ojs_global_data_init() {
    // fill e5ojs_global_data with settings data
    // get current settings
    e5ojs_refresh_admin_pages_data(function(){
        // get post types
        e5ojs_init(function(){});
    });
}
exports.e5ojs_global_data_init = e5ojs_global_data_init;


var e5ojs_refresh_admin_pages_data = function e5ojs_refresh_admin_pages_data(callback) {
    // fill e5ojs_global_data with settings data
    // get current settings
    e5ojs_settings.e5ojs_settings_get_all(function(current_settings){
        var settings_admin_pages_data = {};
        for( var settings_key in current_settings ) {
            if( current_settings[settings_key].settings_id == "settings_admin_pages_data" ) {
                settings_admin_pages_data = current_settings[settings_key].settings_value;
                break;
            }
        }

        for( var page_data_key in settings_admin_pages_data ) {
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
    });
}
exports.e5ojs_refresh_admin_pages_data = e5ojs_refresh_admin_pages_data;

/* ============== end e5ojs configuration ============== */
