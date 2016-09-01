'use strict';
var file_name = "e5ojs-session-message.js";
console.log(file_name,"Module loaded...");


// e5ojs start local requires settings
var e5ojs_config = require("../e5ojs-config.js");
var e5ojs_session = require('../model/e5ojs-session.js');
// e5ojs end local requires settings



// MD5
var md5 = require('md5');
// mongodb
//var e5ojs_db = require('../config/e5ojs-mongodb.js');



// get global data from config
var e5ojs_global_data = e5ojs_config.e5ojs_global_data;









/*  start e5ojs session message functions  */
exports.e5ojs_push_session_message = function e5ojs_push_session_message(req,message_object) {
    var e5ojs_session = req.session;
    e5ojs_session.e5ojs_message = message_object;
}
exports.e5ojs_get_session_message = function e5ojs_get_session_message(req) {
    var e5ojs_session = req.session;
    var message_object = {};
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_message !== 'undefined' && e5ojs_session.e5ojs_message != null ) {
         message_object = e5ojs_session.e5ojs_message;
    }
    return message_object;
}
exports.e5ojs_clear_session_message = function e5ojs_clear_session_message(req) {
    var e5ojs_session = req.session;
    if( e5ojs_session !== 'undefined' && typeof e5ojs_session.e5ojs_message !== 'undefined' && e5ojs_session.e5ojs_message != null ) {
         delete e5ojs_session.e5ojs_message;
    }
}
/*  end e5ojs session message functions  */
