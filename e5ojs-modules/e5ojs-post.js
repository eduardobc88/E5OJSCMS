'use strict';
var file_name = "e5ojs-post.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require('../e5ojs-config/e5ojs-config.js');
// e5ojs end local requires settings




// mongodb
var e5ojs_db = require('../e5ojs-config/e5ojs-mongodb.js');





/* start post DB function */
exports.e5ojs_insert_new_post = function e5ojs_insert_new_post(post_data,callback) {
    e5ojs_db.e5ojs_post.insert(post_data,function(err, result_data){
        // validate error
        callback(result_data);
    });
}
exports.e5ojs_get_post = function e5ojs_get_post(post_id,callback) {
    e5ojs_db.e5ojs_post.find({'post_id':parseInt(post_id)},function(err,post_data){
        // validate error
        callback(post_data);
    });
}
exports.e5ojs_update_post = function e5ojs_update_post(post_data,callback) {
    // param new: true to return the modification post
    e5ojs_db.e5ojs_post.findAndModify({query: { 'post_id': parseInt(post_data.post_id) },update: post_data,new: false},function(err, result_data){
        // validate error
        callback(result_data);
    });
}
exports.e5ojs_change_post_status = function e5ojs_change_post_status(post_id,status,callback) {
    e5ojs_db.e5ojs_post.update( {'post_id':parseInt(post_id)}, { $set: {'post_status': status} }, {new: false,multi: true}, function(err, result_data){
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
exports.e5ojs_change_post_status_multiple = function e5ojs_change_post_status_multiple(post_ids,status,callback) {
    var ids_array = Array();
    post_ids.forEach(function(val,key){
        ids_array.push( parseInt(post_ids[key]) );
    });
    e5ojs_db.e5ojs_post.update({'post_id':{$in:ids_array}},{$set:{'post_status':status}},{new: false,multi: true},function(err, result_data){
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
exports.e5ojs_delete_post_status_multiple = function e5ojs_delete_post_status_multiple(post_ids,callback) {
    var ids_array = Array();
    post_ids.forEach(function(val,key){
        ids_array.push( parseInt(post_ids[key]) );
    });
    e5ojs_db.e5ojs_post.remove({'post_id':{$in:ids_array}},function(err, result_data){
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
