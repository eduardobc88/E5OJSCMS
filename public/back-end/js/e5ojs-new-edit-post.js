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
    e5ojs_map_ini();
});

















var array_map = [];
var array_marks = [];
var max_marks = 30;

function e5ojs_map_ini() {

    // init for all maps individual
    $(".e5ojs-map").each(function(key,val){
        // get json value
        var map_data = $(this).parent().find(".map-data").val();
        var map_key_id = $(this).parent().find(".map-data").attr("data-meta-key-map");

        var array_marks_source = [];

        if( map_data != "" && map_data != "null" ) {
            array_marks_source = JSON.parse(map_data);
        } else {
            $(this).parent().find(".map-data").val("");
        }
        // draw map
        map = new google.maps.Map($(".e5ojs-map")[key], {
            center: {lat: 19.6871377, lng: -101.1899671},
            zoom: 8,
            draggable: true,
            scrollwheel: false,
            animation: google.maps.Animation.DROP,
            map_index: key,
            map_total_marks: 0,
            array_marks: [],
            array_infowindow: [],
            array_marks_source: array_marks_source,
            last_info_window_open_key: -1,
        });
        array_map.push( map );


        // draw marks
        for( key_mark in array_marks_source ) {
            mark_data = array_marks_source[key_mark];
            e5ojs_map_draw_marker(array_map[key],key_mark,mark_data.position,false);
        }
        e5ojs_map_resize(array_map[key]);


        // event click on map to add new marker
        google.maps.event.addListener(array_map[key], 'click', function(event) {
            //console.log("map clicked",array_map[key]);
            if( array_map[key].map_total_marks < max_marks ) {
                array_map[key].map_total_marks = parseInt(array_map[key].map_total_marks) + 1;
                e5ojs_map_draw_marker(array_map[key],parseInt(array_map[key].map_total_marks)-1,event.latLng,true);
            }
        });
    });

}

function e5ojs_map_draw_marker(map, key_mark, location, is_new) {
    var marker = new google.maps.Marker({
        position: location,
        map: map,
        draggable: true,
        marker_position: key_mark,
    });
    map.array_marks.push(marker);
    if( is_new ) {
        map.array_marks_source.push({'position':location,'text':''});
        e5ojs_map_set_value(map);
    } else {
        map.map_total_marks = map.map_total_marks+1;
    }

    // set input value
    var contentString = '<div id="content" style="width: 300px;">'+
      '<div class="input-field">'+
      '<input type="text" class="marker-text" placeholder="Your text here" value="'+map.array_marks_source[key_mark].text+'">'+
      '<label for="input-'+key_mark+'">Some text</label>'+
      '</div>'+
      '<div id="input-'+key_mark+'" class="aling-right"><button class="waves-effect waves-dark btn marker-close-btn" mark-position="'+key_mark+'" mark-map-index="'+map.map_index+'">Agree<i class="material-icons">save</i></button></div>'+
      '</div>';


    // marker info window
    var infowindow = new google.maps.InfoWindow({
        content: contentString,
    });
    map.array_infowindow[key_mark] = infowindow;

    // marker listeners
    marker.addListener('click', function() {
        if( map.last_info_window_open_key != -1 ) {
            map.array_infowindow[map.last_info_window_open_key].close();
            map.last_info_window_open_key = marker.marker_position;
        } else {
            map.last_info_window_open_key = marker.marker_position;
        }
        map.array_infowindow[map.last_info_window_open_key].open(map, marker);
        setTimeout(function(){
            $(".marker-text").focus();
        },500);

        $(".marker-close-btn").unbind();
        $(".marker-close-btn").on('click',function(e){
            e.preventDefault();

            mark_position = $(this).attr("mark-position");
            map_id = mark_position = $(this).attr("mark-map-index");
            array_map[map_id].array_marks_source[marker.marker_position].text = $(this).parent().parent().find(".marker-text").val();
            // remove this mark
            /*
            delete array_marks[mark_position];
            delete array_marks_source[mark_position];
            marker.setMap(null);
            */
            e5ojs_map_set_value(array_map[map_id]);
            map.array_infowindow[map.last_info_window_open_key].close();
            e5ojs_map_resize(array_map[map_id]);
        });
        map.setCenter(marker.getPosition());
    });
    marker.addListener('dragend', function() {
        /*
        console.log("marker",marker.marker_position);
        console.log("marker position",marker.getPosition());
        */
        mark_text = map.array_marks_source[marker.marker_position].text;
        map.array_marks_source[marker.marker_position] = {'position':marker.getPosition(),'text':mark_text};
        //console.log("map.array_marks_source",map.array_marks_source);
        e5ojs_map_set_value(map);
    });
}
function e5ojs_map_resize(map) {
    if( map.array_marks.length == 0 ) {
        map.setCenter({lat: 19.6871377, lng: -101.1899671});
    } else {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < map.array_marks.length; i++) {
            if( map.array_marks[i] === undefined ) {
                console.log("undefined mark");
            } else {
                //console.log("MARK",map.array_marks[i]);
                bounds.extend(map.array_marks[i].getPosition());
            }
        }
        map.fitBounds(bounds);
    }
}
function e5ojs_map_set_value(map) {
    $(".e5ojs-map").each(function(key,val){
        if( map.map_index == key ) {
            $(this).parent().find(".map-data").val(JSON.stringify(map.array_marks_source));
            //console.log("MAP DATA",JSON.stringify(map.array_marks_source));
        }
    });
}
