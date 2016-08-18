/*
if "new:true" found object data and override with new object data
if "new:false"  found object data but only update the passed fileds
*/

/* start counter function */
function e5ojs_get_next_id(name,callback) {
    db.e5ojs_counter.findAndModify({query: { '_id': name },update: { $inc: { 'seq': 1 } },new: true},function(err, data){
        // validate error
        callback(data);
    });
}
