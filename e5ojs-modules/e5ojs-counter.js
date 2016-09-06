'use strict';
var file_name = "e5ojs-counter.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require('../e5ojs-config/e5ojs-config.js');
// e5ojs end local requires settings

// mongodb
var e5ojs_db = require('../e5ojs-config/e5ojs-mongodb.js');


/*
if "new:true" found object data and override with new object data
if "new:false"  found object data but only update the passed fileds
*/

/* start counter function */
exports.e5ojs_get_next_id = function e5ojs_get_next_id(name,callback) {
    e5ojs_db.e5ojs_counter.findAndModify({query: { '_id': name },update: { $inc: { 'seq': 1 } },new: true},function(err, data){
        // validate error
        callback(data);
    });
}
