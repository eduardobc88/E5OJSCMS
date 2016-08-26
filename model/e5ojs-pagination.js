'use strict';
var file_name = "e5ojs-pagination.js";
console.log(file_name,"Module loaded...");


/* start generate pagination */

exports.e5ojs_get_pagination = function e5ojs_get_pagination(total_pages, current_page, total_post, base_url) {
    var range = 2;
    var e5ojs_pagintion = [];
    var e5ojs_pagination_count = 0;
    if( current_page == total_pages ) {
        e5ojs_pagintion[e5ojs_pagination_count++] = {url:base_url+'page/1/', number:1 ,current:'current'};
        return e5ojs_pagintion;
    }
    for (var p = 1; p < total_pages; ++p) {
        if( p >= (current_page-range) && p <= (current_page+range) ) {
            e5ojs_pagintion[e5ojs_pagination_count++] = {url:base_url+'page/'+p+'/', number:p, current:((p==current_page)?'current':'')};
        }
    }
    return e5ojs_pagintion;
}

/* end generate pagination */
