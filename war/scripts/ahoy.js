/* Application Namespace
 *****************************************/
( function(ahoy, $, undefined) {

    }(window.ahoy = window.ahoy || {}, jQuery));

/* Data Namespace
 *****************************************/
( function(data, $, undefined) {

        // Parameters as Moment objects

        data.track = function(from, to) {
            ahoy.ui.spinner.start("body");

            from = from.format(ahoy.util.moment.TIMESTAMP_FORMAT);
            to = to.format(ahoy.util.moment.TIMESTAMP_FORMAT);

            console.log("Tracking from: " + from + " to: " + to);

            $.getJSON("track", {
                "from" : from,
                "to" : to
            }).done(function(data) {
                ahoy.ui.spinner.stop();

                //console.log("Data returned from server: " + JSON.stringify(data));

                if (data) {

                    ahoy.geo.load(data);

                } else {
                    console.log("No data received");
                }

            }).fail(function() {
                console.log("Failed to call servlet");

                ahoy.ui.toaster("No data available at the selected time.");

            }).always(function() {

                ahoy.ui.spinner.stop();
            });
        };

        data.sectors = function() {
            $.ajax({
                "url" : "data/sectors.json",
                "dataType" : "json"
            }).done(function(data) {

                //console.log("Data returned from server: " + JSON.stringify(data));

                if (data) {
                    ahoy.geo.load(data, {
                        "type" : "sectors"
                    });
                    ahoy.ui.toaster("Boundaries loaded");

                } else {
                    console.log("No data received");
                }

            }).fail(function() {
                console.log("Failed to call servlet: sectors");

            }).always(function() {

            });
        };

    }(window.ahoy.data = window.ahoy.data || {}, jQuery));

/* Geo Namespace
 *****************************************/

( function(geo, $, undefined) {

        var vposMap = null;
        var infoWindow = null;
        var polyInfoWindow = null;
        var vposMarkers = [];
        var vposClusterer = null;
        var sectors = [];
        var iconBase = 'images/';
        var icons = {
            "ship" : {
                icon : iconBase + 'ferry.png'
            }
        };

        geo.map = function(opts) {
            var map, defaults, novena, changiPier, berths;

            //novena = new google.maps.LatLng(1.320458, 103.843843);
            changiPier = new google.maps.LatLng(1.310957, 104.026769);

            defaults = {
                "containerId" : "map-canvas",
                "zoomLevel" : 10,
                "center" : changiPier
            };

            if ( typeof opts === "object") {
                opts = $.extend(defaults, opts);
            } else {
                opts = defaults;
            }

            map = new google.maps.Map(document.getElementById(opts.containerId), {
                center : opts.center,
                zoom : opts.zoomLevel,
                mapTypeId : google.maps.MapTypeId.HYBRID,
                scaleControl : true
            });

            /*
             berths = new google.maps.KmlLayer({
             url : "http://portahoy.appspot.com/data/berths.kml"
             });
             //console.log(berths.getStatus());
             berths.setMap(map);
             */

            ahoy.data.sectors();

            console.log("Map initialized");

            vposMap = map;

            return map;

        };

        geo.load = function(data, opts) {
            var map, defaults, oldMarkers = [], newMarkers = [], clusterer;

            defaults = {
                "type" : "markers"
            };

            if ( typeof opts === "object") {
                opts = $.extend(defaults, opts);
            } else {
                opts = defaults;
            }

            // TODO: assign objects based on map id option
            map = vposMap;
            oldMarkers = vposMarkers;
            clusterer = vposClusterer;

            newMarkers = markers(data);

            if (map) {

                if (opts.type === "sectors") {

                    clearPolygons(sectors);
                    sectors = addPolygons(map, data);
                } else {

                    // Close infowindow

                    if (infoWindow) {
                        infoWindow.close();
                    }

                    // Remove markers from previous selection

                    clearMarkers(oldMarkers, clusterer);

                    addMarkers(map, newMarkers);
                    // TODO: cache markers based on map id option
                    vposMarkers = newMarkers;

                    clusterer = clusterMarkers(map, newMarkers);
                    // TODO: cache clusterer based on map id option
                    vposClusterer = clusterer;
                }

            }
        };

        function markers(data) {
            var i, markers = [], m;

            if (!ahoy.util.array.isEmpty(data)) {
                for ( i = 0; i < data.length; i++) {
                    m = marker(data[i]);
                    markers.push(m);
                }
            }

            return markers;
        }

        function marker(data) {
            var marker, position;

            position = new google.maps.LatLng(data.lat, data.lng);

            marker = new google.maps.Marker({
                draggable : false,
                position : position,
                title : data.address,
                icon : icons["ship"].icon
            });

            marker.set("vposition", data);

            return marker;
        }

        function addMarkers(map, markers) {
            var bounds, i = 0;
            bounds = new google.maps.LatLngBounds();
            for ( i = 0; i < markers.length; i++) {
                markers[i].setMap(map);
                setInfoWindow(markers[i], map);
                bounds.extend(markers[i].getPosition());
            }
            map.fitBounds(bounds);
        }

        function clusterMarkers(map, markers, opts) {
            // TODO: Implement options

            var clusterer = new MarkerClusterer(map, markers, {
                "gridSize" : 60, // default size is 60px
                "maxZoom" : 13,
                "title" : "Number of ships in this cluster"
            });

            return clusterer;
        }

        function panAndZoom(map, marker) {

            //TODO: zoom out, pan and zoom in animation (like Google Earth)

            map.panTo(marker.getPosition());

        }

        function setInfoWindow(marker, map) {
            var content, vpos, timestamp;

            google.maps.event.addListener(marker, 'click', function() {

                // Beware marker scope problem, use "this" marker
                // that the listener is attached to

                panAndZoom(map, this);

                vpos = this.get("vposition");

                timestamp = moment(vpos.timestamp, ahoy.util.moment.TIMESTAMP_FORMAT);
                timestamp = timestamp.format("DD MMM YYYY, h:mmA");

                content = "<p>Vessel ID: <strong>" + vpos.vid + "</strong><br/>";
                content += "Gross Tonnage: <strong>" + vpos.grossTonnage + "</strong><br/>";
                content += "Speed: <strong>" + vpos.speed + "</strong><br/>";
                content += "Course: <strong>" + vpos.course + "</strong><br/>";
                content += "Length: <strong>" + vpos.length + "</strong><br/>";
                content += "Beam: <strong>" + vpos.beam + "</strong><br/>";
                content += "Country of Registration: <strong>" + vpos.country + "</strong><br/>";
                content += "<span class='text-muted'>As at " + timestamp + "</span><br/></p>";

                if (infoWindow) {
                    infoWindow.close();
                }
                infoWindow = new google.maps.InfoWindow({
                    content : content
                });
                infoWindow.open(map, this);
            });
        }

        function clearMarkers(markers, clusterer) {
            var i = 0;
            if (!ahoy.util.array.isEmpty(markers)) {
                for ( i = 0; i < markers.length; i++) {
                    markers[i].setMap(null);
                    google.maps.event.clearInstanceListeners(markers[i]);
                }
            }

            if (clusterer) {
                clusterer.clearMarkers();
            }
        }

        function addPolygons(map, data) {
            var i, j, poly, polygons = [], coords = [], points = [], lat, lng;

            if (data) {

                for ( i = 0; i < data.length; i++) {

                    coords = data[i].coords;
                    points = [];

                    for ( j = 0; j < coords.length; j++) {
                        if (j % 2 == 0) {
                            lng = coords[j];
                        } else {
                            lat = coords[j];

                            points.push(new google.maps.LatLng(lat, lng));

                        }

                    }

                    poly = new google.maps.Polygon({
                        paths : points,
                        strokeColor : '#0000FF',
                        strokeOpacity : 0.8,
                        strokeWeight : 2,
                        fillColor : '#0000FF',
                        fillOpacity : 0.35
                    });

                    poly.setMap(map);
                    poly.set("sector", data[i]);

                    google.maps.event.addListener(poly, 'click', function(event) {
                        var content;
                        var sector = this.get("sector");

                        content = "<p><strong>" + sector.name + "</strong><br/>";
                        content += sector.type + " (" + sector.code + ")<br/></p>";

                        if (polyInfoWindow) {
                            polyInfoWindow.close();
                        }

                        polyInfoWindow = new google.maps.InfoWindow({
                            "content" : content,
                            "position" : event.latLng
                        });
                        polyInfoWindow.open(map);

                    });
                    
                    google.maps.event.addListener(poly, 'mouseover', function() {
                        this.setOptions({
                           strokeColor : '#FF0000', 
                           fillColor : '#FF0000'
                        });
                        
                    });
                    
                    google.maps.event.addListener(poly, 'mouseout', function() {
                        this.setOptions({
                           strokeColor : '#0000FF', 
                           fillColor : '#0000FF'
                        });
                        
                    });

                    polygons.push(poly);
                }
            }
            return polygons;
        }

        function clearPolygons(polys) {
            var i = 0;

            if (!ahoy.util.array.isEmpty(polys)) {
                //console.log("polys array is not empty");
                for ( i = 0; i < polys.length; i++) {
                    polys[i].setMap(null);
                    google.maps.event.clearInstanceListeners(polys[i]);
                }
            }
        }

    }(window.ahoy.geo = window.ahoy.geo || {}, jQuery));

/* Data Visualization Namespace
 *****************************************/

( function(viz, $, undefined) {

        viz.timeline = function(opts) {
            var defaults, container, timeline, items, customTime;

            defaults = {
                "containerId" : "timeline",
                "start" : moment("2014-05-31 00:00:00"),
                "end" : moment("2014-06-01 23:59:59"),
                "customTimeOffset" : 24
            };

            if ( typeof opts === "object") {
                opts = $.extend(defaults, opts);
            } else {
                opts = defaults;
            }

            // DOM element where the Timeline will be attached
            container = $("#" + opts.containerId);

            items = new vis.DataSet();

            // Create timeline

            timeline = new vis.Timeline(container[0], items, {
                "showCurrentTime" : true,
                "showCustomTime" : true,
                "min" : opts.start.toDate(),
                "max" : opts.end.toDate(),
                "start" : opts.start.toDate(),
                "end" : opts.end.toDate()
            });

            // Set the custom time bar

            customTime = opts.start.clone().add("hours", opts.customTimeOffset);
            timeline.setCustomTime(customTime.toDate());
            timeChanged(customTime);

            timeline.on('timechanged', function(properties) {
                var timeOnFocus = moment(properties.time);
                timeChanged(timeOnFocus);
            });

            // Enable tooltip

            ahoy.ui.timeline.tooltip(container);
        };

        function timeChanged(timeOnFocus) {

            // 4 minutes time window

            var windowLength = 4 * 60;

            var from = timeOnFocus.clone().subtract("seconds", windowLength / 2);
            var to = timeOnFocus.clone().add("seconds", windowLength / 2);

            // e.g. {"time":"2014-07-18T00:20:34.635Z"}

            $("#debug").text(timeOnFocus);

            //var timeOnFocus = moment("2014-05-31 14:25:00.999", "YYYY-MM-DD HH:mm:ss.SSS");

            ahoy.data.track(from, to);
        }

    }(window.ahoy.viz = window.ahoy.viz || {}, jQuery));

/* UI Namespace
 *****************************************/

( function(ui, $, undefined) {
        ui.spinner = {};
        ui.timeline = {};

        ui.spinner.start = function(target) {
            var domElement = null;

            spinner = new Spinner({
                lines : 13, // The number of lines to draw
                length : 7, // The length of each line
                width : 4, // The line thickness
                radius : 10, // The radius of the inner circle
                corners : 1, // Corner roundness (0..1)
                rotate : 0, // The rotation offset
                color : '#000', // #rgb or #rrggbb
                speed : 1, // Rounds per second
                trail : 60, // Afterglow percentage
                shadow : false, // Whether to render a shadow
                hwaccel : false, // Whether to use hardware acceleration
                className : 'spinner', // The CSS class to assign to the spinner
                zIndex : 2e9, // The z-index (defaults to 2000000000)
                top : $(window).height() / 2.5, // Manual positioning in viewport
                left : "auto"
            });

            domElement = $(target)[0];

            spinner.spin(domElement);
        };

        ui.spinner.stop = function() {
            spinner.stop();
        };

        ui.timeline.tooltip = function(target) {

            target.tooltip({
                title : "Drag the blue time bar to see the vessel traffic at that moment in time",
                placement : "top",
                html : false,
                trigger : "hover"
            });

        };

        ui.toaster = function(msg, opts) {
            // TODO: implement options
            toastr.options = {
                "closeButton" : false,
                "debug" : false,
                "positionClass" : "toast-bottom-right",
                "showDuration" : "300",
                "hideDuration" : "1000",
                "timeOut" : "5000",
                "extendedTimeOut" : "1000",
                "showEasing" : "swing",
                "hideEasing" : "linear",
                "showMethod" : "fadeIn",
                "hideMethod" : "fadeOut"
            };
            toastr.info(msg);
        };
    }(window.ahoy.ui = window.ahoy.ui || {}, jQuery));

/* Util Namespace
 *****************************************/

( function(util, $, undefined) {

        util.moment = {};
        util.array = {};

        util.array.isEmpty = function(arr) {
            if (arr && $.isArray(arr) && arr.length > 0) {
                return false;
            }
            return true;
        };

        util.moment.TIMESTAMP_FORMAT = "YYYY-MM-DD HH:mm:ss.SSS";

    }(window.ahoy.util = window.ahoy.util || {}, jQuery));
