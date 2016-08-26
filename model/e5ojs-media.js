'use strict';
var file_name = "e5ojs-media.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config.js");
// e5ojs end local requires settings


// MD5
var md5 = require('md5');
// mongojs
var mongojs = require('mongojs');
var db = mongojs("e5ojs_db");


// get global data from config
var e5ojs_global_data = e5ojs_config.e5ojs_global_data;




/* start media DB function */
exports.e5ojs_get_all_media = function e5ojs_get_all_media(callback) {
    db.e5ojs_media.find({},function(err, media_data){
        // validate error
        if( err ) {
            callback(false);
        } else {
            callback(media_data);
        }
    });
}
exports.e5ojs_insert_new_media = function e5ojs_insert_new_media(post_data,callback) {
    db.e5ojs_media.insert(post_data,function(err, result_data){
        // validate error
        callback(result_data);
    });
}
exports.e5ojs_get_media = function e5ojs_get_media(media_ids,callback) {
    if( media_ids === undefined ) {
        callback(false);
    }
    var media_ids_array = media_ids.split(",");
    var media_ids = [];
    for( var media_key in media_ids_array ) {
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





/* start Media API DB functions */

exports.e5ojs_media_api_get_media = function e5ojs_media_api_get_media(media_ids, callback) {
    db.e5ojs_media.find({'media_id':{$in:media_ids}},function(err, media_result){
        if( err )
            callback([]);
        else
            callback(media_result);
    });
}
exports.e5ojs_media_api_delete_media = function e5ojs_media_api_delete_media(media_ids, callback) {
    db.e5ojs_media.remove({'media_id':{$in:media_ids}},function(err, result_media_delete){
        if( err )
            callback([]);
        else
            callback(result_media_delete);
    });
};

/* end Media API DB functions */
