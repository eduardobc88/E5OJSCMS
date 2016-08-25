'use strict';
var file_name = "e5ojs-user.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config.js");
// e5ojs end local requires settings


// MD5
var md5 = require('md5');
// mongojs
var mongojs = require('mongojs');
var db = mongojs("e5ojs_db");






/* start users DB functions */

exports.e5ojs_user_insert = function e5ojs_user_insert(user_data, callback) {
    db.e5ojs_user.insert(user_data, function(err, result){
        callback({'error':err, user_data:result});
    });
}
exports.e5ojs_valid_user_email = function e5ojs_valid_user_email(user_login,user_email, callback) {
    db.e5ojs_user.find({'user_login':user_login,'user_email':user_email}).count(function(q_req, q_res, q_next){
        total_find = parseInt(q_res);
        callback(total_find);
    });
}
exports.e5ojs_user_get = function e5ojs_user_get(user_id, callback) {
    db.e5ojs_user.find({'user_id':parseInt(user_id)}, function(err, user_data){
        callback({'error':err, 'user_data':user_data});
    });
}
exports.e5ojs_user_update = function e5ojs_user_update(user_data, callback) {
    db.e5ojs_user.update({'user_id':parseInt(user_data.user_id)},{$set:user_data},{new:false},function(err, user_data){
        callback({'error':err, 'user_data':user_data});
    });
}
exports.e5ojs_change_user_status_multiple = function e5ojs_change_user_status_multiple(user_ids,status,callback) {
    var ids_array = Array();
    user_ids.forEach(function(val,key){
        ids_array.push( parseInt(user_ids[key]) );
    });
    db.e5ojs_user.update({'user_id':{$in:ids_array}},{$set:{'user_status':parseInt(status)}},{new:false, multi:true},function(err, result_data){
        if( err ) {
            callback({ok:0});
        } else {
            if( result_data.nModified > 0 ) {
                e5ojs_config.e5ojs_init(function(){
                    callback({status:1});
                });
            } else {
                e5ojs_config.e5ojs_init(function(){
                    callback({status:0});
                });
            }
        }
    });
}
exports.e5ojs_remove_user_status_multiple = function e5ojs_remove_user_status_multiple(user_ids,callback) {
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
                e5ojs_config.e5ojs_init(function(){
                    callback({status:1});
                });
            } else {
                e5ojs_config.e5ojs_init(function(){
                    callback({status:0});
                });
            }
        }
    });
}

/* end users DB functions */
