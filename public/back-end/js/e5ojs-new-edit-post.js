$(document).ready(function(){
    console.log("E5OJS - ADMIN","e5ojs-new-edit-post-js");
    var editor = $('#post_content');
    editor.summernote({
        height: 300,
        onpaste: function(content) {
            console.log("summernote - onpaste",content);
            setTimeout(function () {
                editor.code(content.target.textContent);
            }, 10);
        }
    });
});
