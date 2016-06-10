
var e5ojs_media_open = false;
var e5ojs_media_element_selected = {};
$(document).ready(function(){
    console.log("E5OJS","e5ojs-media-js");
    // button or image to open media
    $(".e5ojs-open-media").on("click",function(){
        e5ojs_open_media();
    });
});
$(document).load(function(){

});

function e5ojs_upload_media() {

    e5ojs_upload_media_status('Choose a file :)');
    // Check to see when a user has selected a file
    var e5ojs_timer_id;
    e5ojs_check_for_upload();
    function e5ojs_check_for_upload() {
        e5ojs_timer_id = setInterval(function(){
            if( $('#e5ojs_file_input').val() !== '' ) {
                clearInterval(e5ojs_timer_id);
                $('#e5ojs-upload-form').submit();
            }
        }, 500);
    }
    $('#e5ojs-upload-form').submit(function() {
        e5ojs_upload_media_status('Uploading the file ...');
        $(this).ajaxSubmit({
            error: function(xhr) {
                $('#e5ojs_file_input').val("");
		        e5ojs_upload_media_status('Error: ' + xhr.status);
                e5ojs_check_for_upload();
            },
            success: function(response) {
                $('#e5ojs_file_input').val("");
                e5ojs_check_for_upload();
                if( response.upload ) {
                    e5ojs_upload_media_status("Success!");
                    var media_element = response.e5ojs_file_data;
                    var media_id = media_element.media_id;
                    var media_url = e5ojs_media_sizes_url+media_element.media_file_name_clean+"-150x150."+(media_element.media_mime_type.split("/"))[1];
                    var element = '<div class="card-image waves-effect waves-dark"><img src="'+media_url+'" class="img-responsive item" data-media-id="'+media_id+'"/></div>';
                    $(".e5ojs-media-popup-wrapper").find(".media-items").append(element);
                    e5ojs_option_to_media();
                    e5ojs_select_item();
                } else
                    e5ojs_upload_media_status("Error!");
            }
        });
        // Have to stop the form from submitting and causing
        // a page refresh - don't forget this
    	return false;
    });
    function e5ojs_upload_media_status(message) {
        $('#e5ojs-upload-form-status').text(message);
    }
    e5ojs_options();
}


function e5ojs_open_media() {
    // show media popup
    if( e5ojs_media_open ) {
        e5ojs_media_open = false;
        $(".e5ojs-media-popup-wrapper").fadeOut();
    } else {
        e5ojs_media_open = true;
        $(".e5ojs-media-popup-wrapper").fadeIn();

        e5ojs_upload_media();
        e5ojs_set_size();
        // resize
        e5ojs_print_all_media(function(){
            $(window).resize(function(){
                setTimeout(function(){
                    e5ojs_set_size();
                },300);
            });
        });
    }
}
function e5ojs_set_size() {
    var window_height = $(window).height();
    $(".e5ojs-media-popup-wrapper").find(".card-content").height(window_height-80);
    if( $(window).width() <= 991 ) {
        $(".e5ojs-media-popup-wrapper .container-fluid .media-wrapper").height(window_height-180-$(".e5ojs-media-popup-wrapper .container-fluid .media-info").height());
    } else {
        $(".e5ojs-media-popup-wrapper .container-fluid .media-wrapper").height(window_height-180);
    }
}
function e5ojs_print_all_media(callback) {
    // request json
    $.getJSON( e5ojs_all_media_url, function( media_gallery_json ) {
        var all_media = media_gallery_json[0];
        if( all_media.status ) {
            $.each(all_media.media_posts,function(key,media_element){
                var media_id = media_element.media_id;
                var media_url = e5ojs_media_sizes_url+media_element.media_file_name_clean+"-150x150."+(media_element.media_mime_type.split("/"))[1];
                var element = '<div class="card-image waves-effect waves-dark"><img src="'+media_url+'" class="img-responsive item" data-media-id="'+media_id+'"/></div>';
                $(".e5ojs-media-popup-wrapper").find(".media-items").append(element);
                e5ojs_select_item();
            });
        }
    });
    callback();
}

function e5ojs_options() {
    $(".e5ojs-media-popup-wrapper .media-options .option").on("click",function(){
        var option = $(this).attr("data-option");
        $(".e5ojs-media-popup-wrapper .media-options .option").removeClass("current");
        $(this).addClass("current");
        if( option == "media") {
            $(".e5ojs-media-popup-wrapper .container-fluid .media-wrapper").show();
            $(".e5ojs-media-popup-wrapper .container-fluid .upload-wrapper").hide();
        } else if( option == "upload" ) {
            $(".e5ojs-media-popup-wrapper .container-fluid .media-wrapper").hide();
            $(".e5ojs-media-popup-wrapper .container-fluid .upload-wrapper").show();
        }
    });
    $("#e5ojs-media-select").on("click",function(){
        // close media
        $(".e5ojs-media-popup-wrapper").fadeOut();
    });
}
function e5ojs_option_to_media() {
    $(".e5ojs-media-popup-wrapper .media-options .option").each(function(key,element){
        if( $(this).hasClass("current") ) {
            $(this).removeClass("current");
        } else {
            $(this).addClass("current");
            $(".e5ojs-media-popup-wrapper .container-fluid .media-wrapper").show();
            $(".e5ojs-media-popup-wrapper .container-fluid .upload-wrapper").hide();
        }
    });
}
function e5ojs_select_item() {
    $(".e5ojs-media-popup-wrapper .media-wrapper .media-items .card-image").on("click",function(){
        e5ojs_media_element_selected.media_id = $(this).find("img").attr("data-media-id");
        e5ojs_media_element_selected.media_url = $(this).find("img").attr("src");
        // set on preview image
        var preview_image_element = $(".e5ojs-media-popup-wrapper").find(".media-info").find("img");
        $(preview_image_element).attr("src",e5ojs_media_element_selected.media_url);
        console.log("e5ojs_catch_media_select ",e5ojs_media_element_selected);
    });
}
/*
(function( $ ) {
    $.fn.e5ojs_catch_media_select = function(callback) {

    };
}( jQuery ));*/
