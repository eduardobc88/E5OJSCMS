$(document).ready(function(){
    console.log("E5OJS","e5ojs-media-js");
    // button or image to open media
    $(".e5ojs-open-media").on("click",function(){
        var image_preview = $(this);
        var input_media_id = $(".post_media_id");
        var media_image = e5ojs_media.init({
            title:"Select or upload a image"
        }).e5ojs_open_media().on("select",function(element){
            $(input_media_id).val(element.item.media_id);
            $(image_preview).attr("src",element.sizes[3]);
        });
    });
});
$(document).load(function(){

});








/* start E%OJS MEDIA PICKER UPLOAD */

var e5ojs_media = {
    e5ojs_media_wrapper: ".e5ojs-media-popup-wrapper",
    e5ojs_media_open: false,
    e5ojs_media_element_selected: {},
    e5ojs_media_sizes: {},
    e5ojs_timer_id: null,
    init: function(init_data) {
        $(this.e5ojs_media_wrapper).find(".card-title").html(init_data.title);
        return {
            e5ojs_open_media: function() {
                console.log("e5ojs_open_media");
                // open close media wrapper
                function e5ojs_open_media_popup() {
                    // show media popup
                    e5ojs_media.e5ojs_media_open = true;
                    $(e5ojs_media.e5ojs_media_wrapper).fadeIn();

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
                // Check to see when a user has selected a file
                function e5ojs_check_for_upload() {
                    e5ojs_clear_interval();
                    e5ojs_media.e5ojs_timer_id = setInterval(function(){
                        if( $('#e5ojs_file_input').val() !== '' && e5ojs_media.e5ojs_timer_id != null ) {
                            e5ojs_clear_interval();
                            $('#e5ojs-upload-form').submit();
                        }
                    }, 2000);
                }
                function e5ojs_clear_interval() {
                    clearInterval(e5ojs_media.e5ojs_timer_id);
                    e5ojs_media.e5ojs_timer_id = null;
                }
                // upload media action
                function e5ojs_upload_media() {
                    $('#e5ojs-upload-form').unbind();
                    // clear interval
                    e5ojs_check_for_upload();
                    e5ojs_upload_media_status('Choose a file :)');
                    $('#e5ojs-upload-form').submit(function() {
                        e5ojs_upload_media_status('Uploading...');
                        $(this).ajaxSubmit({
                            error: function(xhr) {
                                $('#e5ojs-upload-form').resetForm();
                		        e5ojs_upload_media_status('Error: ' + xhr.status);
                                e5ojs_check_for_upload();
                            },
                            uploadProgress: function(event, position, total, percentComplete) {
                                var percentVal = percentComplete + '%';
                                $(e5ojs_media.e5ojs_media_wrapper).find("#progress").css({
                                    width:percentVal
                                });
                                $(e5ojs_media.e5ojs_media_wrapper).find("#e5ojs-upload-progress-bar-wrapper").find("p").html(percentVal);
                        		//console.log(percentVal, position, total);
                            },
                            success: function(response) {
                                $('#e5ojs-upload-form').resetForm();
                                if( response.upload ) {
                                    e5ojs_upload_media_status("Success!");
                                    var media_element = response.e5ojs_file_data;
                                    //console.log(media_element);
                                    var media_id = media_element.media_id;
                                    var media_url = e5ojs_media_sizes_url+media_element.media_file_name_clean+"-150x150."+(media_element.media_mime_type.split("/"))[1];
                                    var media_name = media_element.media_name;
                                    var media_date = media_element.media_date;
                                    var element = '<div class="card-image waves-effect waves-dark"><img src="'+media_url+'" class="img-responsive item" data-media-id="'+media_id+'" data-media-name="'+media_name+'" data-media-date="'+media_date+'"/></div>';
                                    $(e5ojs_media.e5ojs_media_wrapper).find(".media-items").prepend(element);
                                    e5ojs_option_to_media();
                                    e5ojs_select_item();
                                } else {
                                    e5ojs_upload_media_status("Error!");
                                }
                                // clear progress data
                                $(e5ojs_media.e5ojs_media_wrapper).find("#progress").css({
                                    width:"0%"
                                });
                                $(e5ojs_media.e5ojs_media_wrapper).find("#e5ojs-upload-progress-bar-wrapper").find("p").html("");
                                e5ojs_check_for_upload();
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
                // set popup size
                function e5ojs_set_size() {
                    var window_height = $(window).height();
                    var content_media_bottom_height = $(e5ojs_media.e5ojs_media_wrapper).find(".content-media-bottom").height();
                    $(e5ojs_media.e5ojs_media_wrapper).find(".card-content").height(window_height-80);
                    if( $(window).width() <= 991 ) {
                        $(e5ojs_media.e5ojs_media_wrapper).find(".media-wrapper").height(window_height-(content_media_bottom_height+180));
                        $(e5ojs_media.e5ojs_media_wrapper).find(".upload-wrapper").height(window_height-(content_media_bottom_height+180));
                    } else {
                        $(e5ojs_media.e5ojs_media_wrapper).find(".media-wrapper").height(window_height-(content_media_bottom_height+180));
                        $(e5ojs_media.e5ojs_media_wrapper).find(".upload-wrapper").height(window_height-(content_media_bottom_height+180));
                    }
                }
                // ajax request
                function e5ojs_print_all_media(callback) {
                    // request json
                    $.getJSON( e5ojs_all_media_url, function( media_gallery_json ) {
                        var all_media = media_gallery_json[0];
                        if( all_media.status ) {
                            e5ojs_media.e5ojs_media_sizes = all_media.sizes;
                            //e5ojs_media_sizes
                            $(e5ojs_media.e5ojs_media_wrapper).find(".media-items").html("");
                            $.each(all_media.media_posts,function(key,media_element){
                                var media_id = media_element.media_id;
                                var media_url = e5ojs_media_sizes_url+media_element.media_file_name_clean+"-150x150."+(media_element.media_mime_type.split("/"))[1];
                                var media_name = media_element.media_name;
                                var media_date = media_element.media_date;
                                var element = '<div class="card-image waves-effect waves-dark"><img src="'+media_url+'" class="img-responsive item" data-media-id="'+media_id+'" data-media-name="'+media_name+'" data-media-date="'+media_date+'"/></div>';
                                $(e5ojs_media.e5ojs_media_wrapper).find(".media-items").prepend(element);
                            });
                            e5ojs_select_item();
                        }
                    });
                    callback();
                }
                // options actions
                function e5ojs_options() {
                    $(e5ojs_media.e5ojs_media_wrapper+" .media-options .option").unbind();
                    $(e5ojs_media.e5ojs_media_wrapper+" .media-options .option").on("click",function(){
                        var option = $(this).attr("data-option");
                        $(e5ojs_media.e5ojs_media_wrapper+" .media-options .option").removeClass("current");
                        $(this).addClass("current");
                        if( option == "media") {
                            $(e5ojs_media.e5ojs_media_wrapper+" .container-fluid .media-wrapper").show();
                            $(e5ojs_media.e5ojs_media_wrapper+" .container-fluid .upload-wrapper").hide();
                        } else if( option == "upload" ) {
                            $(e5ojs_media.e5ojs_media_wrapper+" .container-fluid .media-wrapper").hide();
                            $(e5ojs_media.e5ojs_media_wrapper+" .container-fluid .upload-wrapper").show();
                        }
                    });
                    $("#e5ojs-media-select").unbind();
                    $("#e5ojs-media-select").on("click",function(){
                        // clear interval
                        e5ojs_check_for_upload();
                        // close media
                        $(e5ojs_media.e5ojs_media_wrapper).fadeOut();
                        e5ojs_media.e5ojs_media_open = false;
                    });
                    $("#e5ojs-close-media").unbind();
                    $("#e5ojs-close-media").on("click",function(){
                        // clear interval
                        e5ojs_check_for_upload();
                        // close media
                        $(e5ojs_media.e5ojs_media_wrapper).fadeOut();
                        e5ojs_media.e5ojs_media_open = false;
                    });
                }
                function e5ojs_option_to_media() {
                    $(e5ojs_media.e5ojs_media_wrapper+" .media-options .option").each(function(key,element){
                        $(this).removeClass("current");
                        if( $(this).attr("data-option") == "media" ) {
                            $(this).addClass("current");
                            $(e5ojs_media.e5ojs_media_wrapper+" .container-fluid .media-wrapper").show();
                            $(e5ojs_media.e5ojs_media_wrapper+" .container-fluid .upload-wrapper").hide();
                        }
                    });
                }
                function e5ojs_select_item() {
                    $(e5ojs_media.e5ojs_media_wrapper+" .media-wrapper .media-items .card-image").unbind();
                    $(e5ojs_media.e5ojs_media_wrapper+" .media-wrapper .media-items .card-image").on("click",function(){
                        $(e5ojs_media.e5ojs_media_wrapper).find(".media-items").find(".card-image").removeClass("current");
                        $(this).addClass("current");
                        e5ojs_media.e5ojs_media_element_selected.media_id = $(this).find("img").attr("data-media-id");
                        e5ojs_media.e5ojs_media_element_selected.media_url = $(this).find("img").attr("src");
                        e5ojs_media.e5ojs_media_element_selected.media_name = $(this).find("img").attr("data-media-name");
                        e5ojs_media.e5ojs_media_element_selected.media_date = $(this).find("img").attr("data-media-date");
                        // set on preview image
                        var preview_image_element = $(e5ojs_media.e5ojs_media_wrapper).find(".media-info").find("img");
                        $(preview_image_element).attr("src",e5ojs_media.e5ojs_media_element_selected.media_url);
                        $(e5ojs_media.e5ojs_media_wrapper).find(".media-info").find(".title-info").html(e5ojs_media.e5ojs_media_element_selected.media_name);
                        $(e5ojs_media.e5ojs_media_wrapper).find(".media-info").find(".extra").html(e5ojs_media.e5ojs_media_element_selected.media_date);
                    });
                }
                // init all
                e5ojs_open_media_popup();
                e5ojs_option_to_media();


                // return callback event with data object
                return {
                    on: function(action,callback) {
                        switch (action) {
                            case 'select':
                                $("#e5ojs-media-select").on("click",function(){
                                    // close media
                                    $(e5ojs_media.e5ojs_media_wrapper).fadeOut();
                                    e5ojs_media.e5ojs_media_open = false;
                                    // set sizes urls
                                    var url_sizes = new Array();
                                    $.each(e5ojs_media.e5ojs_media_sizes,function(key,val){
                                        url_sizes.push(e5ojs_media.e5ojs_media_element_selected.media_url.replace("150x150", key));
                                    });
                                    callback({item:e5ojs_media.e5ojs_media_element_selected,sizes:url_sizes});
                                });
                            break;
                        }
                    }
                }


            }
        }
    },
}

/* end E%OJS MEDIA PICKER UPLOAD */
