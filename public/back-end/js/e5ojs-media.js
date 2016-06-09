$(document).ready(function(){
    console.log("E5OJS","e5ojs-media-js");
    e5ojs_open_media();
    e5ojs_upload_media();
});
$(document).load(function(){
    e5ojs_open_media();
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
                console.log("success : ",response);
                e5ojs_check_for_upload();
                if( response.upload )
                    e5ojs_upload_media_status("Success!");
                else
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

}


function e5ojs_open_media() {
    e5ojs_set_size();
    // resize
    $(window).resize(function(){
        setTimeout(function(){
            e5ojs_set_size();
        },300);
    });
    e5ojs_options();
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
}
