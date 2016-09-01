'use strict';
var file_name = "e5ojs-page.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config.js");
var e5ojs_counter = require('../model/e5ojs-counter.js');
// e5ojs end local requires settings



// remove diacritics
var remove_diacritics = require('diacritics').remove;
// generate slug from string
var getSlug = require('speakingurl');
// mongodb
var e5ojs_db = require('../config/e5ojs-mongodb.js');


/* start page DB function */
exports.e5ojs_page_get_all = function e5ojs_page_get_all(page_status, callback) {
    e5ojs_db.e5ojs_page.find({'page_status':page_status},function(err, result_pages){
        if( err )
            callback(null);
        else
            callback(result_pages);
    });
}
exports.e5ojs_page_insert_new = function e5ojs_page_insert_new(page_data, callback) {
    // get increment e5ojs_media
    e5ojs_counter.e5ojs_get_next_id('page',function(data){
        // increment post_type counter
        var next_id = data.seq;
        page_data.page_id = parseInt(next_id);
        page_data.page_slug = getSlug(remove_diacritics( page_data.page_title ));
        e5ojs_db.e5ojs_page.insert(page_data,function(err, result_data){
            if( err )
                callback(null);
            else
                callback(result_data);
        });
    });
}
exports.e5ojs_page_get_page = function e5ojs_page_get_page(page_id, callback) {
    e5ojs_db.e5ojs_page.find({'page_id':parseInt(page_id)},function(err,result_data){
        if( err )
            callback(null);
        else
            callback(result_data);
    });
}
exports.e5ojs_page_update = function e5ojs_page_update(page_data, callback) {
    page_data.page_id = parseInt(page_data.page_id);
    page_data.page_slug = getSlug(remove_diacritics( page_data.page_title ));
    e5ojs_db.e5ojs_page.update({'page_id':parseInt(page_data.page_id)},{$set:page_data},{new:false},function(err,result_data){
        if( err )
            callback(null);
        else
            callback(result_data);
    });
}
exports.e5ojs_delete_page_status_multiple = function e5ojs_delete_page_status_multiple(page_ids,callback) {
    var ids_array = Array();
    page_ids.forEach(function(val,key){
        ids_array.push( parseInt(page_ids[key]) );
    });
    e5ojs_db.e5ojs_page.remove({'page_id':{$in:ids_array}},function(err, result_data){
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
exports.e5ojs_change_page_status_multiple = function e5ojs_change_page_status_multiple(page_ids,status,callback) {

    var ids_array = Array();
    page_ids.forEach(function(val,key){
        ids_array.push( parseInt(page_ids[key]) );
    });
    e5ojs_db.e5ojs_page.update({'page_id':{$in:ids_array}},{$set:{'page_status':status}},{new: false,multi: true},function(err, result_data){
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
/* end page DB function */
