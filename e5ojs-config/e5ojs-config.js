'use strict';
// format date
var date_format = require('dateformat');
var current_date = new Date();

let e5ojs_config = {
    e5ojs_host_url: "http://localhost",
    e5ojs_admin_post_peer_page: 12,
    e5ojs_theme_post_peer_page: 12,
    e5ojs_refresh_admin_router: false,
    e5ojs_refresh_router: false,
    e5ojs_global_data: {},
    e5ojs_router : [],
};

// fill e5ojs admin tree
e5ojs_config.e5ojs_global_data.admin_pages = {
    dashboard: {title:"dashboard",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/", icon_name:"dashboard", position:1, show_menu: 1},
    pages: {title:"pages",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/page/", icon_name:"filter_none", position:2, show_menu: 1},
    admin_post_types: {},
    media: {title:"media",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/media/", icon_name:"collections", position:3, show_menu: 1},
    post_type: {title:"post types",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/post-types/", icon_name:"settings", position:4, show_menu: 1},
    users: {title:"users",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/users/", icon_name:"supervisor_account", position:5, show_menu: 1},
    settings: {title:"settings",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/settings/", icon_name:"settings", position:6, show_menu: 1},
    search: {title:"search",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/search/", icon_name:"search", position:7, show_menu: 0},
};
e5ojs_config.e5ojs_global_data.current_page_key = "dashboard";
e5ojs_config.e5ojs_global_data.current_post_type_key = "";
e5ojs_config.e5ojs_global_data.admin_sub_pages = {
    pages: [{title:"All",url:e5ojs_config.e5ojs_host_url+"/admin/page/all/page/1/"},{title:"publish",url:e5ojs_config.e5ojs_host_url+"/admin/page/publish/page/1/"},{title:"Pending",url:e5ojs_config.e5ojs_host_url+"/admin/page/pending/page/1/"},{title:"Trash",url:e5ojs_config.e5ojs_host_url+"/admin/page/trash/page/1/"},{title:'New',url:e5ojs_config.e5ojs_host_url+"/admin/page/action/new/"}],
    post_type: [{title:"All",url:e5ojs_config.e5ojs_host_url+"/admin/post-types/all/page/1/"},{title:"Active",url:e5ojs_config.e5ojs_host_url+"/admin/post-types/active/page/1/"},{title:"Deactive",url:e5ojs_config.e5ojs_host_url+"/admin/post-types/deactive/page/1/"},{title:'New',url:e5ojs_config.e5ojs_host_url+"/admin/post-types/action/new/"}],
    users: [{title:"All",url:e5ojs_config.e5ojs_host_url+"/admin/users/all/page/1/"},{title:"Active",url:e5ojs_config.e5ojs_host_url+"/admin/users/active/page/1/"},{title:"Deactive",url:e5ojs_config.e5ojs_host_url+"/admin/users/deactive/page/1/"},{title:'New',url:e5ojs_config.e5ojs_host_url+"/admin/users/action/new/"}],
};
e5ojs_config.e5ojs_global_data.admin_post_type_sub_pages = [{title:"All",url:"all/page/1/"},{title:"publish",url:"publish/page/1/"},{title:"Pending",url:"pending/page/1/"},{title:"Trash",url:"trash/page/1/"},{title:'New',url:"action/new/"}];
e5ojs_config.e5ojs_global_data.admin_other_pages = {
    login: {title:"Login",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/login/", icon_name:"dashboard",position:1},
    new_post: {title:"New post",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/", icon_name:"dashboard",position:1},
    edit_post: {title:"Edit post",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/", icon_name:"dashboard",position:1},
    new_post_type: {title:"New post type",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/", icon_name:"dashboard",position:1},
    edit_post_type: {title:"Edit post type",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/", icon_name:"dashboard",position:1},
    new_user: {title:"New user",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/", icon_name:"supervisor_account",position:1},
    edit_user: {title:"Edit user",description:"Lorem ipsum...",url:e5ojs_config.e5ojs_host_url+"/admin/", icon_name:"supervisor_account",position:1},
};
e5ojs_config.e5ojs_global_data.admin_actions = {
    page: {
        action: 'action/',
        new: 'action/new/',
        edit: 'action/edit/',
        delete: 'action/delete/',
        pagination_all: 'all/page/',
        pagination_publish: 'publish/page/',
        pagintaion_pending: 'pending/page/',
        pagination_trash: 'trash/page/',
    },
    post_types: {
        action: 'action/',
        new: 'action/new/',
        edit: 'action/edit/',
        delete: 'action/delete/',
        pagination_all: 'all/page/',
        pagination_active: 'active/page/',
        pagination_deactive: 'deactive/page/',
    },
    post_type: {
        action: 'action/',
        new: 'action/new/',
        edit: 'action/edit/',
        trash: 'action/trash/',
        delete: 'action/delete/',
        pagination_all: 'all/page/',
        pagination_publish: 'publish/page/',
        pagintaion_pending: 'pending/page/',
        pagination_trash: 'trash/page/',
    },
    users: {
        action: 'action/',
        new: 'action/new/',
        edit: 'action/edit/',
        delete: 'action/delete/',
        pagination_all: 'all/page/',
        pagination_active: 'active/page/',
        pagination_deactive: 'deactive/page/',
    }
};
e5ojs_config.e5ojs_global_data.admin_res = {
    base_url: e5ojs_config.e5ojs_host_url,
    current_url: e5ojs_config.e5ojs_host_url,
    assets_url: e5ojs_config.e5ojs_host_url+'/back-end/assets/',
    media_uploads_url: e5ojs_config.e5ojs_host_url+'/uploads/',
    media_uploads_sizes_url: e5ojs_config.e5ojs_host_url+'/uploads/sizes/',
    media_default_image_url: e5ojs_config.e5ojs_host_url+'/back-end/assets/default-post-img.png',
    media_default_image_gallery: "https://placeholdit.imgix.net/~text?txtsize=20&bg=a4a4a4&txtclr=FFFFFF&txt=IMAGE&w=100&h=100&txttrack=0",
    current_date: date_format(current_date,'dd-mm-yyyy'),
};
e5ojs_config.e5ojs_global_data.admin_api = {
    get_all_media: e5ojs_config.e5ojs_host_url+"/admin/all-media/",
    e5ojs_media_api: e5ojs_config.e5ojs_host_url+'/admin/e5ojs-media-api/page/',
};
module.exports = e5ojs_config;
