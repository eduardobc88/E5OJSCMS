'use strict';
var file_name = "e5ojs-settings.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config.js");
// e5ojs end local requires settings

// mongodb
var e5ojs_db = require('../config/e5ojs-mongodb.js');





/* start settings function */
exports.e5ojs_settings_update = function e5ojs_settings_update(settings, settings_count, callback) {
    var settings_id = settings[settings_count].settings_id;
    var settings_value = settings[settings_count].settings_value;
    e5ojs_settings_update_multiple(settings_id, settings_value,function(err, result_settings){
        settings_count = settings_count + 1;
        if( settings_count < settings.length ) {
            e5ojs_settings_update(settings, settings_count, callback); // only pass the callback instead of function to return to the init function call
        } else {
            // return callback
            callback(true);
        }
    });
}
exports.e5ojs_settings_get_by_id = function e5ojs_settings_get_by_id(settings_id, callback) {
    e5ojs_db.e5ojs_settings.find({'settings_id':parseInt(settings_id)},function(err, result_settings){
        if( err )
            callback(null);
        else
            callback(result_settings);
    });
}
exports.e5ojs_settings_get_all = function e5ojs_settings_get_all(callback) {
    e5ojs_db.e5ojs_settings.find({},function(err, result_settings){
        if( err )
            callback(null);
        else
            callback(result_settings);
    });
}
// private function
function e5ojs_settings_update_multiple(settings_id, settings_value, callback) {
    e5ojs_db.e5ojs_settings.update({'settings_id':settings_id},{$set:{'settings_value':settings_value}},{new:false},function(err, result_settings){
        if( err )
            callback(null);
        else
            callback(result_settings);
    });
}
/* end settings function */
