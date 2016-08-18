// mongojs
var mongojs = require('mongojs');
var db = mongojs("e5ojs_db");


/* start SEARCH DB functions */
var e5ojs_search = function() {
    var self = this;
    var host_url = "http://nodejs.dev";

    self.search = function(key_words, callback){
        // before this you need indexes the each documents
        // db.e5ojs_page.createIndex({"page_title":"text"})
        var result_search = [];
        db.e5ojs_page.find({$text: {$search:key_words} }, function(err, page_result){
            if( page_result.length > 0 ) {
                for( page_key in page_result ) {
                    result_search.push( {
                        id: page_result[page_key].page_id,
                        title: page_result[page_key].page_title,
                        url: host_url+"/admin/page/action/edit/"+page_result[page_key].page_id,
                    });
                }
            }
            // get post types
            db.e5ojs_post_type.find({},function(err, post_types_result){
                var post_types = [];
                for( post_type_key in post_types_result ) {
                    post_types.push({post_type_id:post_types_result[post_type_key].post_type_id, slug:post_types_result[post_type_key].post_type_slug});
                }
                db.e5ojs_post.find({$text: {$search:key_words} }, function(err, post_result){
                    if( post_result.length > 0 ) {
                        for( post_key in post_result ) {
                            for( pp_key in post_types ) {
                                if( post_types[pp_key].post_type_id == post_result[post_key].post_post_type_id ) {
                                    result_search.push( {
                                        id: post_result[post_key].post_id,
                                        title: post_result[post_key].post_title,
                                        url: host_url+"/admin/post-type/"+post_types[pp_key].slug+"/action/edit/"+post_result[post_key].post_id,
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

    self.test = function() {
        console.log("e5ojs_search","test function");
    }

}

module.exports = e5ojs_search;







// function e5ojs_search(key_words, callback) {
//     // before this you need indexes the each documents
//     // db.e5ojs_page.createIndex({"page_title":"text"})
//     var result_search = [];
//     db.e5ojs_page.find({$text: {$search:key_words} }, function(err, page_result){
//         if( page_result.length > 0 ) {
//             for( page_key in page_result ) {
//                 result_search.push( {
//                     id: page_result[page_key].page_id,
//                     title: page_result[page_key].page_title,
//                     url: host_url+"/admin/page/action/edit/"+page_result[page_key].page_id,
//                 });
//             }
//         }
//         // get post types
//         db.e5ojs_post_type.find({},function(err, post_types_result){
//             var post_types = [];
//             for( post_type_key in post_types_result ) {
//                 post_types.push({post_type_id:post_types_result[post_type_key].post_type_id, slug:post_types_result[post_type_key].post_type_slug});
//             }
//             db.e5ojs_post.find({$text: {$search:key_words} }, function(err, post_result){
//                 if( post_result.length > 0 ) {
//                     for( post_key in post_result ) {
//                         for( pp_key in post_types ) {
//                             if( post_types[pp_key].post_type_id == post_result[post_key].post_post_type_id ) {
//                                 result_search.push( {
//                                     id: post_result[post_key].post_id,
//                                     title: post_result[post_key].post_title,
//                                     url: host_url+"/admin/post-type/"+post_types[pp_key].slug+"/action/edit/"+post_result[post_key].post_id,
//                                 });
//                                 break;
//                             }
//                         }
//                     }
//                 }
//                 callback(result_search);
//             });
//         });
//     });
// }

/* end SEARCH DB functions */
