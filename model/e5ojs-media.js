
/* start media DB function */
function e5ojs_get_all_media(callback) {
    db.e5ojs_media.find({},function(err, media_data){
        // validate error
        if( err ) {
            callback(false);
        } else {
            callback(media_data);
        }
    });
}
function e5ojs_insert_new_media(post_data,callback) {
    db.e5ojs_media.insert(post_data,function(err, result_data){
        // validate error
        callback(result_data);
    });
}
function e5ojs_get_media(media_ids,callback) {
    if( media_ids === undefined ) {
        callback(false);
    }
    var media_ids_array = media_ids.split(",");
    var media_ids = [];
    for( media_key in media_ids_array ) {
        media_ids.push(parseInt(media_ids_array[media_key]));
    }
    db.e5ojs_media.find({'media_id':{$in:media_ids}},function(err, media_data){
        if( err ) {
            callback(false);
        } else {
            if( media_data.length )
                callback(media_data);
            else
                callback(false);
        }
    });
}
/* end media DB function */





/* start Media API DB functions */

function e5ojs_media_api_get_media(media_ids, callback) {
    db.e5ojs_media.find({'media_id':{$in:media_ids}},function(err, media_result){
        if( err )
            callback([]);
        else
            callback(media_result);
    });
}
function e5ojs_media_api_delete_media(media_ids, callback) {
    db.e5ojs_media.remove({'media_id':{$in:media_ids}},function(err, result_media_delete){
        if( err )
            callback([]);
        else
            callback(result_media_delete);
    });
};

/* end Media API DB functions */
