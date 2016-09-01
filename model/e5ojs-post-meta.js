'use strict';
var file_name = "e5ojs-post-meta.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config.js");
var e5ojs_counter = require('../model/e5ojs-counter.js');
// e5ojs end local requires settings


// mongodb
var e5ojs_db = require('../config/e5ojs-mongodb.js');



/* set function e5ojs_init and validate session as modules too for fix all */





/* start post meta DB function */

exports.e5ojs_update_post_meta = function e5ojs_update_post_meta(post_meta_data,callback) {
    if( post_meta_data.length == 0 ) {
        callback(null);
    } else {
        // loop post meta
        var count_meta = 0;
        var total_meta = post_meta_data.length;
        e5ojs_update_post_meta_fill(post_meta_data,count_meta,total_meta,function(result_meta_update){
            callback(result_meta_update);
        });
    }
}
exports.e5ojs_insert_post_meta = function e5ojs_insert_post_meta(post_meta_data,callback) {
    if( post_meta_data.length == 0 ) {
        callback(null);
    } else {
        // loop post meta
        var count_meta = 0;
        var total_meta = post_meta_data.length;
        this.e5ojs_post_meta_fill_data(post_meta_data,count_meta,total_meta,function(post_meta_data_fill){
            //console.log("post_meta_data_fill",post_meta_data_fill);
            // insert post metas
             e5ojs_insert_post_meta_save(post_meta_data_fill,function(post_meta_result){
                 //console.log("post_meta_result",post_meta_result)
                 callback(post_meta_result);
            });
        });
    }
}
exports.e5ojs_post_meta_fill_data = function e5ojs_post_meta_fill_data(post_meta_data,count_meta,total_meta,callback) {
    // get next ID
    var post_meta = post_meta_data[count_meta];// get meta data
    // get next id for this meta
    e5ojs_counter.e5ojs_get_next_id("post_meta",function(data){
        var next_id = data.seq;
        post_meta.post_meta_id = next_id;
        post_meta_data[count_meta] = post_meta;
        count_meta = count_meta+1;
        if( count_meta < total_meta ) {
            // next meta
            this.e5ojs_post_meta_fill_data(post_meta_data,count_meta,total_meta,callback);
        } else {
            // callback
            callback(post_meta_data);
        }
    });
}
exports.e5ojs_get_post_meta = function e5ojs_get_post_meta(post_id,callback) {
    e5ojs_db.e5ojs_post_meta.find({'post_meta_post_id':parseInt(post_id)},function(err,post_meta_result){
        if( err )
            callback(null);
        else
            callback(post_meta_result);
    });
}






function e5ojs_update_post_meta_fill(post_meta_data,count_meta,total_meta,callback) {
    e5ojs_update_post_meta_save(post_meta_data[count_meta],function(result_meta){
        post_meta_data[count_meta] = result_meta;
        count_meta = count_meta+1;
        if( count_meta < total_meta ) {
            e5ojs_update_post_meta_fill(post_meta_data,count_meta,total_meta,callback);
        } else {
            callback(post_meta_data);
        }
    });
}
function e5ojs_update_post_meta_save(post_meta,callback) {
    e5ojs_db.e5ojs_post_meta.update({'post_meta_id':parseInt(post_meta.post_meta_id),'post_meta_post_id':parseInt(post_meta.post_meta_post_id),'post_meta_name':post_meta.post_meta_name},{$set:{'post_meta_value':post_meta.post_meta_value}},{new:false},function(err,result_meta){
        if( err )
            callback(null);
        else
            callback(result_meta);
    });
}
function e5ojs_insert_post_meta_save(post_meta_data,callback) {
    e5ojs_db.e5ojs_post_meta.insert(post_meta_data,function(err,result){
        if( err )
            callback(null);
        else
            callback(result);
    });
}

/* start post meta DB function */
