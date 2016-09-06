$(document).ready(function(){
    console.log("E5OJS","e5ojs-media-js");
    // button or image to open media for large image
    $(".e5ojs-open-media").on("click",function(){
        var image_preview = $(this);
        var input_media_id = $(image_preview).parent().find(".post_media_id");
        var media_image = e5ojs_media.init({
            title:"Select or upload a image"
        }).e5ojs_open_media().on("select",function(element){
            //console.log("element",element);
            $(input_media_id).val(element.item.media_id);
            $(image_preview).attr("src",element.sizes[3]);
        });
    });
    // 150x150 image
    $(".e5ojs-open-media-small").on("click",function(){
        var image_preview = $(this);
        var input_media_id = $(image_preview).parent().find(".e5ojs_media_id");
        var media_image = e5ojs_media.init({
            title:"Select or upload a image"
        }).e5ojs_open_media().on("select",function(element){
            $(input_media_id).val(element.item.media_id);
            $(image_preview).attr("src",element.sizes[0]);
        });
    });








    // for gallery post meta
    function e5ojs_media_start_action_gallery_meta() {
        $(".e5ojs-open-media-meta").unbind();
        $(".e5ojs-open-media-meta").on("click",function(){
            var image_preview = $(this);
            var input_media_id = "#"+$(this).attr("post-meta-value-id");
            var input_media_value_type = $(this).attr("post-meta-value-type");
            var media_id = $(this).attr("media-id");
            var media_image = e5ojs_media.init({
                title:"Select or upload a image"
            }).e5ojs_open_media().on("select",function(element){
                if( input_media_value_type == "" ) {
                    $(input_media_id).val(element.item.media_id);
                    $(image_preview).attr("src",element.sizes[0]);
                } else {
                    // get current value
                    var current_media_ids = $(input_media_id).val();
                    $(input_media_id).val("");
                    if( current_media_ids == "" ) {
                        $(input_media_id).val(element.item.media_id);
                    } else {
                        // search id and replace
                        if( typeof media_id === 'undefined' ) {
                            // add to array
                            current_media_ids = current_media_ids.split(",");
                            current_media_ids.push(element.item.media_id);
                            urrent_media_ids = current_media_ids.toString();
                            $(input_media_id).val(current_media_ids);
                        } else {
                            current_media_ids = current_media_ids.split(",");
                            position = $.inArray( media_id, current_media_ids );
                            current_media_ids[position] = element.item.media_id;
                            current_media_ids = current_media_ids.toString();
                            $(input_media_id).val(current_media_ids);
                        }
                    }
                    $(image_preview).attr("src",element.sizes[0]);
                }
            });
        });
    }
    e5ojs_media_start_action_gallery_meta();




    // get images from ids
    $(".post-meta-gallery").each(function(key,element){
        // get ids"
        var id_data = "#"+$(this).find(".default-gallery-image-data").attr("post-meta-value-id");
        var image_default_id = $(this).find(".default-gallery-image-data").attr("post-meta-value-id");
        var image_default_url = $(this).find(".default-gallery-image-data").attr("post-meta-image-url");

        var image_ids = $(id_data).val();
        var image_element_wrapper = $(this);
        if( image_ids != "" ) {
            // print all elements from json value

            var image_ids = image_ids.split(",");
            if( image_ids.length > 0 ) {
                $.each(image_ids,function(key,media_id){
                    var element = '<div class="image-ajax-load-wrapper"><img class="e5ojs-open-media-meta e5ojs-get-ajax-image" src="'+image_default_url+'" media-id="'+media_id+'" post-meta-value-id="'+image_default_id+'" post-meta-value-type="json"></div>';
                    $(image_element_wrapper).prepend(element);
                });
                // set actions again
                e5ojs_media_start_action_gallery_meta();
            }
        }
    });

    // add new image to gallery
    $(".post-meta-gallery-add-new").on('click',function(event){
        event.preventDefault();
        //event.prevent.default();
        var element_parent = $(this).closest(".post-meta-gallery");
        var image_default_url = $(element_parent).find(".default-gallery-image-data").attr("post-meta-image-url");
        var image_default_id = $(element_parent).find(".default-gallery-image-data").attr("post-meta-value-id");
        var element = '<div class="image-ajax-load-wrapper"><img class="e5ojs-open-media-meta" src="'+image_default_url+'" post-meta-value-id="'+image_default_id+'" post-meta-value-type="json"></div>';
        $(element_parent).prepend(element);
        // remove actions and add again
        $(element_parent).find(".e5ojs-open-media-meta").unbind();
        // set actions again
        e5ojs_media_start_action_gallery_meta();
    });







    // button or image to open media for gallery
    $(".e5ojs-media-editor-add-new").on("click",function(){
        var media_gallery_image = e5ojs_media.init({
            title:"Select or upload a image"
        }).e5ojs_open_media().on("finish_upload",function(finish_upload){
            if( finish_upload.finish_upload == true ) {
                // reload media
                e5ojs_media_editor.init({e5ojs_media_refresh:true});
                e5ojs_media_editor.init({}).e5ojs_get_media_items();
            }
        });
    });

    // position media button add
    e5ojs_media_postion_button();


    // init modal
    $('.modal-trigger').leanModal();

    // init image text
    e5ojs_imagetext_init();
    // init gallerytext
    e5ojs_gallerytext_init();
});
$(window).load(function(){
    /* start media editor page */
    if( $(".e5ojs-media-editor-load-more-btn").length ) {
        e5ojs_media_editor.init({}).e5ojs_get_media_items();
        $(".e5ojs-media-editor-load-more-btn").on('click',function(){
            e5ojs_media_editor.init({}).e5ojs_get_media_items();
        });
    }
    /* end media editor page */

    e5ojs_media_postion_button();

    // get all images on page
    e5ojs_get_ajax_image();
});
$(window).resize(function(){
    e5ojs_media_postion_button();
});
$( window ).scroll(function() {
    e5ojs_media_postion_button();
});










function e5ojs_get_ajax_image() {
    /* get image with media-id attribute in image */
    $(".e5ojs-get-ajax-image").each(function(){
        var image_element = $(this);
        var image_id = $(image_element).attr("media-id");
        if( image_id != "" ) {
            $.getJSON( e5ojs_all_media_url+image_id, function( media_gallery_json ) {
                var all_media = media_gallery_json[0];
                if( all_media.status ) {
                    $.each(all_media.media_posts,function(key,element){

                        var media_element = element;
                        e5ojs_media.e5ojs_media_sizes = all_media.sizes;
                        //e5ojs_media_sizes
                        var media_id = media_element.media_id;
                        // check for image size
                        var image_size = $(image_element).attr("e5ojs-image-get-size");
                        if( image_size === undefined ) {
                            image_size = "-150x150.";
                        } else {
                            image_size = "-"+image_size+".";
                        }
                        var media_url = e5ojs_media_sizes_url+media_element.media_file_name_clean+image_size+(media_element.media_mime_type.split("/"))[1];
                        var media_name = media_element.media_name;
                        var media_date = media_element.media_date;

                        // replace image src
                        e5ojs_replace_img_src($(image_element), media_url);
                    });
                }
            });
        }
    });

    function e5ojs_replace_img_src(image_element, media_url) {

        if( $(image_element).closest(".card-image").hasClass("card-image") ) {
            wrapper_height = $(image_element).parent().height();
            wrapper_width = $(image_element).parent().width();
            $(image_element).parent().css({
                height: wrapper_height,
                width: wrapper_width,
            });
        }
        setTimeout(function(){
            $(image_element).fadeOut(300,function(){
                //setTimeout(function(){
                    $(image_element).attr("src",media_url);
                    $(image_element).fadeIn(300, function(){
                        if( $(image_element).closest(".card-image").hasClass("card-image") ) {
                            $(image_element).parent().removeClass("temp-card-image-wrapper");
                            $(image_element).parent().css({
                                height: "auto",
                                width: "auto",
                            });
                        }
                    });
                //},e5ojs_get_random_int(min=300, max=1000));
            });
        }, e5ojs_get_random_int(min=300, max=1000));
    }
}





/* start e5ojs imagetext */
function e5ojs_imagetext_init() {

    // imagetext single
    $(".e5ojs-open-media-imagetext-meta").unbind();
    $(".e5ojs-open-media-imagetext-meta").on('click',function(){
        var image_preview = $(this);
        var input_media_id = "#"+$(this).attr("post-meta-value-id");
        var media_id = $(this).attr("media-id");
        var imagetext_id = $(input_media_id).val();

        var imagetext_image_value = "";
        var imagetext_text_value = "";
        if( imagetext_id != "" ) {
            var imagetext_json = jQuery.parseJSON(imagetext_id);
            imagetext_image_value = imagetext_json.image_id;
            imagetext_text_value = imagetext_json.image_text;
        }


        var media_image = e5ojs_media.init({
            title:"Select or upload a image"
        }).e5ojs_open_media().on("select",function(element){
            meta_data_json = JSON.stringify({'image_id':element.item.media_id,'image_text':imagetext_text_value});
            //console.log("meta_data_json",meta_data_json);
            $(input_media_id).val(meta_data_json);
            $(image_preview).attr("src",element.sizes[0]);
        });
    });
    // modal imagetext
    $(".post-meta-imagetext .imagetext-modal-btn").unbind();
    $(".post-meta-imagetext .imagetext-modal-btn").on('click',function(){
        var imagetext_wrapper = $(this).parent();
        // get value for modal
        var imagetext_id = $(imagetext_wrapper).find(".meta-image-id").val();

        var imagetext_image_value = "";
        var imagetext_text_value = "";
        console.log("imagetext-modal-btn",imagetext_id);
        if( imagetext_id != "" ) {
            var imagetext_json = jQuery.parseJSON(imagetext_id);
            imagetext_image_value = imagetext_json.image_id;
            imagetext_text_value = imagetext_json.image_text;
        }

        $("#page-modal").find(".modal-value").val(imagetext_text_value);
        $("#page-modal").openModal();
        setTimeout(function(){
            $("#page-modal").find(".modal-value").focus();
        },500);
        $("#page-modal").find(".modal-close").unbind();
        $("#page-modal").find(".modal-close").on('click',function(){
            // get value and set on image value
            meta_data_json = JSON.stringify({'image_id':imagetext_image_value,'image_text':$("#page-modal").find(".modal-value").val()});
            $(imagetext_wrapper).find(".meta-image-id").val(meta_data_json);
            $("#page-modal").closeModal();
        });
    });
}
/* end e5ojs imagetext */

/* start e5ojs gallerytext */
function e5ojs_gallerytext_init() {

    // set image from json value input gallerytext
    $(".post-meta-gallerytext").each(function(key,element){
        // get ids"
        var id_data = "#"+$(this).find(".default-gallery-image-data").attr("post-meta-value-id");
        var image_default = $(this).find(".default-gallery-image-data").attr("post-meta-image-url");
        var image_ids = $(id_data).val();
        if( image_ids != "" ) {
            var image_ids = jQuery.parseJSON(image_ids);
            var gallerytext_wrapper = $(this).find(".post-meta-gallerytext-items");
            format_image_ids = "";
            $.each(image_ids,function(key, val){
                // create element gallerytext
                var element = '<div class="imagetext-wrapper"><img class="e5ojs-open-media-gallerytext-meta e5ojs-get-ajax-image" src="'+image_default+'" media-key="'+key+'" media-id="'+val.image_id+'"><a class="waves-effect waves-light btn modal-trigger imagetext-modal-btn" href="#modal1">Text<i class="material-icons">short_text</i></a></div>';
                $(gallerytext_wrapper).prepend(element);
            });
        }
    });

    // button add new
    $(".post-meta-gallerytext-add-new").unbind()
    $(".post-meta-gallerytext-add-new").on('click',function(){
        // add new alement

        var element_parent = $(this).closest(".post-meta-gallerytext");
        var image_default_url = $(element_parent).find(".default-gallery-image-data").attr("post-meta-image-url");
        var image_default_id = $(element_parent).find(".default-gallery-image-data").attr("post-meta-value-id");
        // get total items on this gallery text
        var media_key = $(element_parent).find(".imagetext-wrapper").length;
        var element = '<div class="imagetext-wrapper"><img class="e5ojs-open-media-gallerytext-meta" src="'+image_default_url+'" media-key="'+media_key+'"><a class="waves-effect waves-light btn modal-trigger imagetext-modal-btn" href="#modal1">Text<i class="material-icons">short_text</i></a></div>';
        $(element_parent).find(".post-meta-gallerytext-items").prepend(element);

        // add new item to value json
        var input_media_id = "#"+$(this).closest(".post-meta-gallerytext").find(".default-gallery-image-data").attr("post-meta-value-id");
        var media_current_json_val =  $(input_media_id).val();
        var imagetext_json = "";
        if( media_current_json_val != "" ) {
            imagetext_json = jQuery.parseJSON(media_current_json_val);
        } else {
            imagetext_json = [];
        }
        meta_data_json = {'image_id':'','image_text':''};
        imagetext_json.push( meta_data_json );
        imagetext_json = JSON.stringify(imagetext_json);
        $(input_media_id).val(imagetext_json);

        // set actions again
        e5ojs_media_start_action_gallerytext_meta();

    });

    function e5ojs_media_start_action_gallerytext_meta() {
        // imagetext single
        $(".e5ojs-open-media-gallerytext-meta").unbind();
        $(".e5ojs-open-media-gallerytext-meta").on('click',function(){
            var image_preview = $(this);
            var input_media_id = "#"+$(this).closest(".post-meta-gallerytext").find(".default-gallery-image-data").attr("post-meta-value-id");
            var media_id = $(this).attr("media-id");
            var media_key = $(this).attr("media-key");
            var media_current_json_val =  $(input_media_id).val();

            var imagetext_image_value = "";
            var imagetext_text_value = "";
            var imagetext_json = "";


            if( media_current_json_val != "" ) {
                imagetext_json = jQuery.parseJSON(media_current_json_val);
                // search the position element
                imagetext_image_value = imagetext_json[media_key].image_id;
                imagetext_text_value = imagetext_json[media_key].image_text;
            }


            var media_image = e5ojs_media.init({
                title:"Select or upload a image"
            }).e5ojs_open_media().on("select",function(element){
                var image_selected_id = element.item.media_id;
                // when is empty value json
                if( imagetext_json == "" ) {
                    meta_data_json = {'image_id':image_selected_id,'image_text':imagetext_text_value};
                    $.extend( imagetext_json={}, meta_data_json );
                    imagetext_json = JSON.stringify(imagetext_json);
                    $(input_media_id).val(imagetext_json);
                    // set actions again
                    e5ojs_media_start_action_gallerytext_meta();
                } else {
                    // already exist
                    // search item on json
                    imagetext_json[media_key].image_id = image_selected_id;
                    // set on input value
                    imagetext_json = JSON.stringify(imagetext_json);
                    $(input_media_id).val(imagetext_json);
                    $(image_preview).attr("media-id",image_selected_id);
                }
                $(image_preview).attr("src",element.sizes[0]);
            });
        });
        // modal imagetext
        $(".post-meta-gallerytext .imagetext-modal-btn").unbind();
        $(".post-meta-gallerytext .imagetext-modal-btn").on('click',function(){
            var input_media_id = "#"+$(this).closest(".post-meta-gallerytext").find(".default-gallery-image-data").attr("post-meta-value-id");
            var media_id = $(this).parent().find(".e5ojs-open-media-gallerytext-meta").attr("media-id");
            var media_key = $(this).parent().find(".e5ojs-open-media-gallerytext-meta").attr("media-key");
            var media_current_json_val =  $(input_media_id).val();


            var imagetext_image_value = "";
            var imagetext_text_value = "";
            var imagetext_json = "";

            if( media_current_json_val != "" ) {
                imagetext_json = jQuery.parseJSON(media_current_json_val);
                // search the position element
                imagetext_image_value = imagetext_json[media_key].image_id;
                imagetext_text_value = imagetext_json[media_key].image_text;
            }

            $("#page-modal").find(".modal-value").val(imagetext_text_value);
            $("#page-modal").openModal();
            setTimeout(function(){
                $("#page-modal").find(".modal-value").focus();
            },500);
            $("#page-modal").find(".modal-close").unbind();
            $("#page-modal").find(".modal-close").on('click',function(){
                // search item on json
                imagetext_json[media_key].image_text = $("#page-modal").find(".modal-value").val();
                // set on input value
                imagetext_json = JSON.stringify(imagetext_json);
                $(input_media_id).val(imagetext_json);
                $("#page-modal").closeModal();
            });
        });
    }
    e5ojs_media_start_action_gallerytext_meta();
}
/* end e5ojs gallerytext */












function e5ojs_media_postion_button() {

    if( $(".e5ojs-media-editor-wrapper").length ) {
        window_height = $(window).height();
        window_scroll = $(window).scrollTop();
        document_heoght = $(document).height();
        button_position = $(".e5ojs-media-editor-wrapper .e5ojs-media-editor-load-more-btn").offset().top + $(".e5ojs-media-editor-wrapper .wrapper-float-btn").height() + 30;
        scroll_area = {start:window_scroll,end:window_scroll+window_height};
        if( button_position > scroll_area.start && button_position < scroll_area.end ) {
            $(".e5ojs-media-editor-wrapper .wrapper-float-btn").css({
                'transition': 'none',
                'position': 'absolute',
                'bottom': '0px',
                'right': '15px'
            });
        } else {
            $(".e5ojs-media-editor-wrapper .wrapper-float-btn").css({
                'transition': 'none',
                'position': 'fixed',
                'bottom': 100,
                'right': $(".e5ojs-media-editor-wrapper .wrapper-float-btn").parent().offset().left + 15
            });
        }
    }
}











/* start E5OJS MEDIA EDITOR LOAD */

var e5ojs_media_editor = {
    e5ojs_media_wrapper: '.e5ojs-media-editor-wrapper',
    e5ojs_media_items_wrapper: '.e5ojs-media-editor-items-wrapper',
    e5ojs_media_actions_wrapper: '.e5ojs-media-editor-actions-wrapper',
    e5ojs_media_load_wrapper: '.e5ojs-media-load-wrapper',
    e5ojs_media_editor_selected_items: [],
    e5ojs_media_api: e5ojs_media_api,
    e5ojs_media_current_page: 1,
    e5ojs_media_total_pages: 1,
    e5ojs_media_refresh: false,
    init: function(init_data) {
        if( init_data.e5ojs_media_refresh == true ) {
            e5ojs_media_editor.e5ojs_media_refresh = false;
            // clear content
            $(e5ojs_media_editor.e5ojs_media_wrapper).find(e5ojs_media_editor.e5ojs_media_items_wrapper).find(".media-content").html("");
            e5ojs_media_editor.e5ojs_media_editor_selected_items = [];
            e5ojs_media_editor.e5ojs_media_current_page = 1;
            e5ojs_media_editor.e5ojs_media_total_pages = 1;
        }
        // init
        return {
            e5ojs_get_media_items: function() {
                if( e5ojs_media_editor.e5ojs_media_current_page <= e5ojs_media_editor.e5ojs_media_total_pages ) {
                    $.getJSON(e5ojs_media_editor.e5ojs_media_api+e5ojs_media_editor.e5ojs_media_current_page+'/', null, function(e5ojs_response_json){
                        e5ojs_media_editor.e5ojs_media_current_page = e5ojs_media_editor.e5ojs_media_current_page + 1;
                        e5ojs_media_api = e5ojs_response_json.e5ojs_media_api;
                        e5ojs_total_media_items = e5ojs_media_api.e5ojs_total_media_items;
                        e5ojs_media_uploads_url = e5ojs_media_api.e5ojs_media_uploads_url;
                        e5ojs_media_uploads_sizes_url = e5ojs_media_api.e5ojs_media_uploads_sizes_url;
                        e5ojs_media_sizes = e5ojs_media_api.e5ojs_media_sizes;
                        e5ojs_total_pages = e5ojs_media_api.e5ojs_total_pages;
                        e5ojs_media_editor.e5ojs_media_total_pages = e5ojs_media_api.e5ojs_total_pages;
                        // generate items
                        $.each(e5ojs_media_api.e5ojs_media_items, function(item_key, media_element){
                            var media_id = media_element.media_id;
                            var media_url = e5ojs_media_uploads_sizes_url+media_element.media_file_name_clean+"-150x150."+(media_element.media_mime_type.split("/"))[1];
                            var media_name = media_element.media_name;
                            var media_date = media_element.media_date;
                            var media_item = '<div class="media-item col-md-2 col-sm-4 col-xs-6 col-centered"><img class="img-responsive waves-effect waves-dark" src="'+media_url+'" data-media-id="'+media_id+'" data-media-name="'+media_name+'" data-media-date="'+media_date+'"></div>';
                            $(e5ojs_media_editor.e5ojs_media_wrapper).find(e5ojs_media_editor.e5ojs_media_items_wrapper).find(".media-content").append(media_item);
                        });
                        // actions for select item
                        e5ojs_select_media_items();
                    });
                }

                function e5ojs_select_media_items() {
                    $(e5ojs_media_editor.e5ojs_media_wrapper).find(e5ojs_media_editor.e5ojs_media_items_wrapper).find(".media-content").find("img").unbind();
                    $(e5ojs_media_editor.e5ojs_media_wrapper).find(e5ojs_media_editor.e5ojs_media_items_wrapper).find(".media-content").find("img").on('click',function(){
                        var data_media_id = $(this).attr("data-media-id");
                        var data_media_name = $(this).attr("data-media-name");
                        if( e5ojs_select_media_is_selected(data_media_id) == false ) {
                            // select
                            $(this).addClass("item-selected");
                            e5ojs_media_editor.e5ojs_media_editor_selected_items.push({data_media_id:data_media_id});
                        } else {
                            // deselected
                            $(this).removeClass("item-selected");
                            e5ojs_delete_media_item_from_selected(data_media_id);
                        }
                    });
                }
                function e5ojs_action_media_editor() {
                    $(e5ojs_media_editor.e5ojs_media_actions_wrapper).find('a').unbind();
                    $(e5ojs_media_editor.e5ojs_media_actions_wrapper).find('a').on('click',function(event){
                        event.preventDefault();
                        var media_action = $(this).attr("media-action");
                        if( media_action == "select" ) {
                            // select all media items
                            e5ojs_select_media_all();
                        }
                        if( media_action == "delete" ) {
                            if( e5ojs_media_editor.e5ojs_media_editor_selected_items.length ) {
                                //console.log("media items selected",e5ojs_media_editor.e5ojs_media_editor_selected_items);
                                e5ojs_media_delete_selected();
                            }
                        }
                    });
                }
                e5ojs_action_media_editor();

                function e5ojs_media_delete_selected() {
                    $.ajax({
                        url: "http://nodejs.dev/admin/e5ojs-media-api/",
                        type: 'DELETE',
                        data: {'media_ids':JSON.stringify(e5ojs_media_editor.e5ojs_media_editor_selected_items)},
                        success: function(e5ojs_result_delete){
                            //console.log("e5ojs_result_delete",e5ojs_result_delete);
                            e5ojs_media_api_delete = e5ojs_result_delete.e5ojs_media_api_delete;
                            e5ojs_delete_status = e5ojs_media_api_delete.e5ojs_delete_status;
                            e5ojs_media_ids = e5ojs_media_api_delete.e5ojs_media_ids;
                            e5ojs_media_ids = jQuery.parseJSON( e5ojs_media_ids.media_ids );

                            if( e5ojs_delete_status == 1 ) {
                                // remove elements from array and image
                                for( element_key in e5ojs_media_ids ) {
                                    media_id_remove = e5ojs_media_ids[element_key].data_media_id;
                                    e5ojs_remove_element_img_and_array(media_id_remove);
                                }
                            }
                        },
                        error: function(e5ojs_result_error){
                            console.log("e5ojs_result_error",e5ojs_result_error);
                        }
                    });
                }

                function e5ojs_remove_element_img_and_array(media_id_remove) {
                    $(e5ojs_media_editor.e5ojs_media_items_wrapper).find("img").each(function(element_key, element_data){
                        var data_media_id = $(element_data).attr("data-media-id");
                        if( media_id_remove == data_media_id ) {
                            // remove img
                            $(this).parent().hide(300,function(){
                                $(this).remove();
                            })
                            // remove from array
                            e5ojs_delete_media_item_from_selected(media_id_remove);
                        }
                    });
                }
                function e5ojs_select_media_all() {
                    if( e5ojs_media_editor.e5ojs_media_editor_selected_items.length ) {
                        // deselected all
                        e5ojs_media_editor.e5ojs_media_editor_selected_items = [];
                        $(e5ojs_media_editor.e5ojs_media_items_wrapper).find("img").each(function(element_key, element_data){
                            var data_media_id = $(element_data).attr("data-media-id");
                            var data_media_name = $(element_data).attr("data-media-name");
                            $(element_data).removeClass("item-selected");
                        });
                    } else {
                        // select all
                        e5ojs_media_editor.e5ojs_media_editor_selected_items = [];
                        $(e5ojs_media_editor.e5ojs_media_items_wrapper).find("img").each(function(element_key, element_data){
                            var data_media_id = $(element_data).attr("data-media-id");
                            var data_media_name = $(element_data).attr("data-media-name");
                            $(element_data).addClass("item-selected");
                            e5ojs_media_editor.e5ojs_media_editor_selected_items.push({data_media_id:data_media_id});
                        });
                    }
                }
                function e5ojs_select_media_is_selected(data_media_id) {
                    for( key_item in e5ojs_media_editor.e5ojs_media_editor_selected_items ) {
                        item_media_id = e5ojs_media_editor.e5ojs_media_editor_selected_items[key_item].data_media_id;
                        if( parseInt(item_media_id) == (data_media_id) )
                            return true;
                    }
                    return false;
                }
                function e5ojs_delete_media_item_from_selected(data_media_id) {
                    for( key_item in e5ojs_media_editor.e5ojs_media_editor_selected_items ) {
                        item_media_id = e5ojs_media_editor.e5ojs_media_editor_selected_items[key_item].data_media_id;
                        if( parseInt(item_media_id) == (data_media_id) ) {
                            e5ojs_media_editor.e5ojs_media_editor_selected_items.splice(key_item, 1);
                            return true;
                        }
                    }
                    return false;
                }

            }
        }
    }
};

/* end E5OJS MEDIA EDITOR LOAD */















/* start E%OJS MEDIA PICKER UPLOAD */

var e5ojs_media = {
    e5ojs_media_wrapper: ".e5ojs-media-popup-wrapper",
    e5ojs_media_open: false,
    e5ojs_media_element_selected: {},
    e5ojs_media_sizes: {},
    e5ojs_timer_id: null,
    e5ojs_finish_upload: false,
    e5ojs_media_api: e5ojs_media_api,
    e5ojs_media_total_pages: 1,
    e5ojs_media_current_page: 1,
    init: function(init_data) {

        $(this.e5ojs_media_wrapper).find(".card-title").html(init_data.title);
        return {
            e5ojs_open_media: function() {
                e5ojs_media.e5ojs_media_total_pages = 1;
                e5ojs_media.e5ojs_media_current_page = 1;
                $(e5ojs_media.e5ojs_media_wrapper).find(".media-items").html("");

                // open close media wrapper
                function e5ojs_open_media_popup() {
                    // show media popup
                    e5ojs_media.e5ojs_media_open = true;
                    $(e5ojs_media.e5ojs_media_wrapper).fadeIn();

                    e5ojs_upload_media();
                    e5ojs_set_size();
                    e5ojs_media_json_request_media();

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
                        e5ojs_media.e5ojs_finish_upload = false;
                        e5ojs_upload_media_status('Uploading...');
                        $(this).ajaxSubmit({
                            error: function(xhr) {
                                $('#e5ojs-upload-form').resetForm();
                		        e5ojs_upload_media_status('Error: ' + xhr.status);
                                e5ojs_check_for_upload();
                                e5ojs_media.e5ojs_finish_upload = false;
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
                                e5ojs_media.e5ojs_finish_upload = true;
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
                // button load more
                function e5ojs_load_more_btn() {
                    $(e5ojs_media.e5ojs_media_wrapper).find(".e5ojs-media-popup-load-more-btn").unbind();
                    $(e5ojs_media.e5ojs_media_wrapper).find(".e5ojs-media-popup-load-more-btn").on('click', function(){
                        e5ojs_media_json_request_media();
                    });
                }

                function e5ojs_media_json_request_media() {
                    if( e5ojs_media.e5ojs_media_current_page <= e5ojs_media.e5ojs_media_total_pages ) {
                        $.getJSON(e5ojs_media.e5ojs_media_api+e5ojs_media.e5ojs_media_current_page+'/', null, function(e5ojs_response_json){
                            e5ojs_media.e5ojs_media_current_page = e5ojs_media.e5ojs_media_current_page + 1;
                            e5ojs_media_api = e5ojs_response_json.e5ojs_media_api;
                            e5ojs_total_media_items = e5ojs_media_api.e5ojs_total_media_items;
                            e5ojs_media_uploads_url = e5ojs_media_api.e5ojs_media_uploads_url;
                            e5ojs_media_uploads_sizes_url = e5ojs_media_api.e5ojs_media_uploads_sizes_url;

                            e5ojs_media.e5ojs_media_sizes = e5ojs_media_api.e5ojs_media_sizes;
                            e5ojs_media.e5ojs_total_pages = e5ojs_media_api.e5ojs_total_pages;
                            e5ojs_media.e5ojs_media_total_pages = e5ojs_media_api.e5ojs_total_pages;
                            // generate items
                            $.each(e5ojs_media_api.e5ojs_media_items, function(item_key, media_element){
                                var media_id = media_element.media_id;
                                var media_url = e5ojs_media_uploads_sizes_url+media_element.media_file_name_clean+"-150x150."+(media_element.media_mime_type.split("/"))[1];
                                var media_name = media_element.media_name;
                                var media_date = media_element.media_date;
                                var media_item = '<div class="card-image waves-effect waves-dark"><img src="'+media_url+'" class="img-responsive item" data-media-id="'+media_id+'" data-media-name="'+media_name+'" data-media-date="'+media_date+'"/></div>';
                                $(e5ojs_media.e5ojs_media_wrapper).find(".media-items").append(media_item);
                            });
                            e5ojs_select_item();
                            // set size
                            $(window).resize(function(){
                                setTimeout(function(){
                                    e5ojs_set_size();
                                },300);
                            });
                        });
                    }
                }
                // init all
                e5ojs_load_more_btn();
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
                            case 'finish_upload':
                                setInterval(function(){
                                    if( e5ojs_media.e5ojs_finish_upload == true ) {
                                        // close media
                                        $(e5ojs_media.e5ojs_media_wrapper).fadeOut();
                                        e5ojs_media.e5ojs_media_open = false;
                                        callback({finish_upload:e5ojs_media.e5ojs_finish_upload});
                                        e5ojs_media.e5ojs_finish_upload = false;
                                    }
                                },1000);
                            break;
                        }
                    }
                }
            }
        }
    },
}

/* end E%OJS MEDIA PICKER UPLOAD */






/* generate ramdom number range */
function e5ojs_get_random_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
