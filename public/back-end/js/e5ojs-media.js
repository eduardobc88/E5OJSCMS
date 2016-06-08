$(document).ready(function(){
    console.log("E5OJS","e5ojs-media-js");
    e5ojs_open_media();
});

function e5ojs_open_media() {
    e5ojs_set_size();
    // resize
    $(window).resize(function(){
        e5ojs_set_size();
    });
}
function e5ojs_set_size() {
    var window_height = $(window).height();
    $(".e5ojs-media-popup-wrapper").find(".card-content").height(window_height-180);
}
