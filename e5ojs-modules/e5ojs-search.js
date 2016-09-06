'use strict';
var file_name = "e5ojs-search.js";
console.log(file_name,"Module loaded...");

// e5ojs start local requires settings
var e5ojs_config = require('../e5ojs-config/e5ojs-config.js');
// e5ojs end local requires settings

// mongodb
var e5ojs_db = require('../e5ojs-config/e5ojs-mongodb.js');









/* start SEARCH DB functions */
exports.search = function search(key_words, callback) {
    // before this you need indexes the each documents
    // e5ojs_db.e5ojs_page.createIndex({"page_title":"text"})
    var result_search = [];
    e5ojs_db.e5ojs_page.find({$text: {$search:key_words} }, function(err, page_result){
        if( page_result.length > 0 ) {
            for( var page_key in page_result ) {
                result_search.push( {
                    id: page_result[page_key].page_id,
                    title: page_result[page_key].page_title,
                    url: e5ojs_config.e5ojs_host_url+"/admin/page/action/edit/"+page_result[page_key].page_id,
                });
            }
        }
        // get post types
        e5ojs_db.e5ojs_post_type.find({},function(err, post_types_result){
            var post_types = [];
            for( post_type_key in post_types_result ) {
                post_types.push({post_type_id:post_types_result[post_type_key].post_type_id, slug:post_types_result[post_type_key].post_type_slug});
            }
            // get posts
            e5ojs_db.e5ojs_post.find({$text: {$search:key_words} }, function(err, post_result){
                if( post_result.length > 0 ) {
                    for( var post_key in post_result ) {
                        for( var pp_key in post_types ) {
                            if( post_types[pp_key].post_type_id == post_result[post_key].post_post_type_id ) {
                                result_search.push( {
                                    id: post_result[post_key].post_id,
                                    title: post_result[post_key].post_title,
                                    url: e5ojs_config.e5ojs_host_url+"/admin/post-type/"+post_types[pp_key].slug+"/action/edit/"+post_result[post_key].post_id,
                                });
                                break;
                            }
                        }
                    }
                }
                callback(result_search);
            });
        });
    });

}

exports.test = function test() {
    console.log(file_name+" - e5ojs_config",e5ojs_config);
}

/* end SEARCH DB functions */
