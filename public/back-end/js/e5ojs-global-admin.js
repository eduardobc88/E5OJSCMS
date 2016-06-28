$(document).ready(function(){
    console.log("E5OJS - ADMIN","e5ojs-global-admin-js");
    e5ojs_header_menu();
    e5ojs_collection_header_select_all();
    e5ojs_custom_collapsible_header_select_all();
    materialize_functions();
    e5ojs_header_options_action();
    e5ojs_custom_collection();
    e5ojs_custom_post_actions();
    $('select').material_select();
});
$(window).load(function(){
    e5ojs_summernote();
});
function e5ojs_summernote() {
    $(".custom-collapsible .collapsible-body .post-content").each(function(key,element){
        $(this).html($(this).text());
    });
}

function e5ojs_custom_post_actions() {
    var base_url = $("#e5ojs-post-form-wrapper").attr("action");
    $(".post-actions a").on("click",function(){
        var post_status = $(this).attr("data-status");
        console.log( post_status );
        $("#e5ojs-post-form-wrapper").attr("action",base_url+post_status+"/");
        $("#e5ojs-post-form-wrapper").submit();
    });
}

function e5ojs_custom_collection() {
    $(".custom-collection .collection-item").hover(function(){
        $(this).find(".secondary-content").stop().dequeue().show();
    },function(){
        $(this).find(".secondary-content").stop().dequeue().hide();
    });
}

function e5ojs_header_options_action() {
    $(".e5ojs-header-bar .search-btn").on("click",function(){
        $(".e5ojs-header-bar .search-bar-content").addClass("search-bar-content-show");
        $(".e5ojs-header-bar .search-bar-content").find("input").val("");
        $(".e5ojs-header-bar .search-bar-content").find("input").focus();
    });
    $(".e5ojs-header-bar .search-bar-content input").focusout(function() {
        $(".e5ojs-header-bar .search-bar-content").removeClass("search-bar-content-show");
    });
}

function materialize_functions() {
    $('.datepicker').pickadate({
        selectMonths: true, // Creates a dropdown to control month
        selectYears: 15, // Creates a dropdown of 15 years to control year
        format: 'dd-mm-yyyy',
        formatSubmit: 'dd-mm-yyyy',
    });
}

function e5ojs_custom_collapsible_header_select_all() {
    // set base url as attr
    $(".custom-collapsible .custom-collapsible-header .bulk-actions").find("li").each(function(key,element){
        var action_element = $(this).find("a");
        var current_link = $(action_element).attr("href");
        action_element.attr("base-url",current_link);
    });

    var collection_ids = Array();
    $(".custom-collapsible .custom-collapsible-header").find("#select-all").on("click",function(){
        var parent_checkbox = $(this);
        collection_ids = Array();
        $(".row-checkbox").each(function(key,element){
            if( $(parent_checkbox).prop('checked') ) {
                $(this).prop( "checked", true );
                // get all post ids
                collection_ids.push( $(this).closest(".custom-collapsible-item").attr("data-collection-id") );
            } else {
                $(this).prop( "checked", false );
                collection_ids = Array();
            }
        });
        // set collection_ids on element bulk actions
        //console.log( "custom-collapsible",collection_ids.join() );
        $(".custom-collapsible .custom-collapsible-header .bulk-actions").find("li").each(function(key,element){
            var action_element = $(this).find("a");
            var current_link = $(action_element).attr("base-url");
            action_element.attr("href",current_link+collection_ids.join()+"/");
        });
    });
    // for individual collection row
    $(".custom-collapsible .row-checkbox").on('click',function(){
        $(this).closest(".custom-collapsible-item").stop().dequeue();
        if( $(this).prop('checked') ) {
            $(this).prop( "checked", true );
            // get all post ids
            collection_ids.push( $(this).closest(".custom-collapsible-item").attr("data-collection-id") );
        } else {
            $(this).prop( "checked", false );
            collection_ids.splice(collection_ids.indexOf( $(this).parent().attr("data-collection-id") ), 1);
        }
        // set collection_ids on element bulk actions
        //console.log("checkbox",collection_ids.join() );
        $(".custom-collapsible .custom-collapsible-header .bulk-actions").find("li").each(function(key,element){
            var action_element = $(this).find("a");
            var current_link = $(action_element).attr("base-url");
            action_element.attr("href",current_link+collection_ids.join()+"/");
        });
    });
    $(".custom-collapsible .secondary-content a").on('click',function(event) {
        window.location = $(this).prop("href");
        return false;
    });
}
function e5ojs_collection_header_select_all() {
    // set base url as attr
    $(".collection-header .bulk-actions").find("li").each(function(key,element){
        var action_element = $(this).find("a");
        var current_link = $(action_element).attr("href");
        action_element.attr("base-url",current_link);
    });

    var collection_ids = Array();
    $(".custom-collection .collection-header").find("#select-all").on("click",function(){
        var parent_checkbox = $(this);
        collection_ids = Array();
        $(".row-checkbox").each(function(key,element){
            if( $(parent_checkbox).prop('checked') ) {
                $(this).prop( "checked", true );
                // get all post ids
                collection_ids.push( $(this).closest(".collection-item").attr("data-collection-id") );
            } else {
                $(this).prop( "checked", false );
                collection_ids = Array();
            }
        });
        // set collection_ids on element bulk actions
        console.log( collection_ids.join() );
        $(".collection-header .bulk-actions").find("li").each(function(key,element){
            var action_element = $(this).find("a");
            var current_link = $(action_element).attr("base-url");
            action_element.attr("href",current_link+collection_ids.join());
        });
    });
    // for individual collection row
    $(".custom-collection .collection-item .row-checkbox").on('click',function(){
        if( $(this).prop('checked') ) {
            $(this).prop( "checked", true );
            // get all post ids
            collection_ids.push( $(this).closest(".collection-item").attr("data-collection-id") );
        } else {
            $(this).prop( "checked", false );
            collection_ids.splice(collection_ids.indexOf( $(this).parent().attr("data-collection-id") ), 1);
        }
        // set collection_ids on element bulk actions
        console.log( collection_ids.join() );
        $(".collection-header .bulk-actions").find("li").each(function(key,element){
            var action_element = $(this).find("a");
            var current_link = $(action_element).attr("base-url");
            action_element.attr("href",current_link+collection_ids.join());
        });
    });
}
function e5ojs_header_menu() {
    // close menu default
    e5ojs_auto_close_left_menu_wrapper();

    $(".e5ojs-header-bar ul.content li.content-left .open-menu").on("click",function(){
        if( $(".e5ojs-menu-left-wrapper").hasClass("e5ojs-menu-left-wrapper-show") ) {
            // open
            $(".e5ojs-menu-left-wrapper").removeClass("e5ojs-menu-left-wrapper-show");
            // change menu icon by arrow back
            $(".e5ojs-header-bar ul.content li.content-left .open-menu i.icon-arrow").css({"opacity":"0"});
            $(".e5ojs-header-bar ul.content li.content-left .open-menu i.icon-menu").css({"opacity":"1"});
        } else {
            // close
            $(".e5ojs-menu-left-wrapper").addClass("e5ojs-menu-left-wrapper-show");
            // change arrow icon by menu
            $(".e5ojs-header-bar ul.content li.content-left .open-menu i.icon-arrow").css({"opacity":"1"});
            $(".e5ojs-header-bar ul.content li.content-left .open-menu i.icon-menu").css({"opacity":"0"});
        }
    });

    $(window).resize(function(){
        e5ojs_auto_close_left_menu_wrapper();
    })
}

function e5ojs_auto_close_left_menu_wrapper() {
    var right_wrapper_position_left = $(".e5ojs-content-right-wrapper").offset().left;
    var left_wrapper_width = $(".e5ojs-menu-left-wrapper").width();
    if( right_wrapper_position_left <= (left_wrapper_width+20) ) {
        // close
        $(".e5ojs-menu-left-wrapper").removeClass("e5ojs-menu-left-wrapper-show");
        // change arrow icon by menu
        $(".e5ojs-header-bar ul.content li.content-left .open-menu i.icon-arrow").css({"opacity":"0"});
        $(".e5ojs-header-bar ul.content li.content-left .open-menu i.icon-menu").css({"opacity":"1"});
    } else {
        // show
        $(".e5ojs-menu-left-wrapper").addClass("e5ojs-menu-left-wrapper-show");
        // change arrow icon by menu
        $(".e5ojs-header-bar ul.content li.content-left .open-menu i.icon-arrow").css({"opacity":"1"});
        $(".e5ojs-header-bar ul.content li.content-left .open-menu i.icon-menu").css({"opacity":"0"});
    }
}
