'use strict';
var file_name = "e5ojs-mongodb.js";
console.log(file_name,"Module loaded...");

var mongojs = require('mongojs');
var db = mongojs("e5ojs_db");

module.exports = db;
