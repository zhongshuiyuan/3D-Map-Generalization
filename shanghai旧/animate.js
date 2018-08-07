const START_DATE = "2007-02-20 07:00:00";
const LOOP_LENGTH = 18000; // 单位s,轨迹中最长的时间
const LOOP_TIME = 100; // 单位s,所有轨迹循环一遍的时间 
var loop_time = 100;
// LOOP_LENGTH/loop_time即speed(动画运动一秒实际车辆行驶多长时间)180s/s

var isLoadBuildings = false;
var isLoadTrips = false;
var isAnimateTrips = false;
var isAnimateTrip = false;
// mapboxgl.accessToken = 'pk.eyJ1IjoibWVuZ2xiaiIsImEiOiJjajhmZWYyNzQwMDNyMzNvMXE4bTRtNm5kIn0.lZXi_nYkbgP2cOGBrE3wbg';

var geojson = {
    "type": "FeatureCollection",
    "features": []
};

var trips = []; // 原始数据数组,存储轨迹线对象的数组
var animatePoints = []; // 运动的点,存储连续5个时刻的轨迹点
var animateLines = []; // 运动的线 

var animateId;
var preTimestamp = 0;  // 将animate()函数中的timestamp导出(单位ms)
var preTimestamp1 = 0; // 记录速度变化后前一段运动的真实时间起点 暂停后再开始的时间起点(单位ms)
var preTimestampToStartDate = 0; // 记录上一点的timestampToStartDate,将timestampToStartDate导出(单位s)              
var preTimestampToStartDate1 = 0; // 记录速度变化后前一段时间的timestampToStartDate(单位s)

// var map = new mapboxgl.Map({
//     style:'mapbox://styles/mapbox/dark-v9',
//     center: [121.479891,31.23],
//     zoom: 10,
//     pitch: 45,
//     //bearing: -17.6,
//     //attributionControl:true,
//     //interactive: false,
//     container: 'map',
//     localIdeographFontFamily: "'Noto Sans', 'Noto Sans CJK SC', sans-serif"
// });

// map.addControl(new mapboxgl.FullscreenControl());
// map.addControl(new mapboxgl.NavigationControl());

map.on('load', function() {
    // document.getElementById('zoom-value').textContent = map.getZoom();
    loadLayers();
});

// 滚轮控制speed    
map.on('wheel', function() {
    // document.getElementById('zoom-value').textContent = map.getZoom();
    if(isLoadTrips && isAnimateTrips) {
        changeSliderValue(map.getZoom());
    }
});

document.getElementById("load-trips").addEventListener("click", function() {
    isLoadTrips = !isLoadTrips;
    
    if(isLoadTrips) {
        document.getElementById("load-trips").innerHTML = "Unload Trips";
        document.getElementById('trips').style.display = "block";
        // 设置trips面板
        var radios = document.getElementsByName('speed');
        for(var j = 0; j < radios.length; j++) {
            radios[j].disabled = true;
        }
        document.getElementById('trips-time-slider').disabled = true;
        document.getElementById('trips-btn').innerHTML = 'Start';

        document.getElementById('trips-btn').addEventListener('click', startAnimateTrips);
        document.getElementById('radios').addEventListener('click', changeTripsSpeed, false);
        document.getElementById('trips-time-slider').addEventListener('input', changeTripsTime);

        loadTrips();

        isAnimateTrips = false;
    } else {
        // 清空轨迹数据
        trips.splice(0, trips.length); //如果不删为了保持颜色一样
        animatePoints.splice(0, animatePoints.length); 
        animateLines.splice(0, animateLines.length);
        
        // 清空source数据，使得不显示
        map.getSource('point0').setData(setPointData([]));
        map.getSource('point1').setData(setPointData([]));
        map.getSource('point2').setData(setPointData([]));
        map.getSource('point3').setData(setPointData([]));
        map.getSource('point4').setData(setPointData([]));

        // 移除事件监听
        document.getElementById("trips-btn").removeEventListener('click', startAnimateTrips);
        document.getElementById('radios').removeEventListener('click', changeTripsSpeed);
        document.getElementById('trips-time-slider').removeEventListener('input', changeTripsTime);

        document.getElementById("load-trips").innerHTML = "Load Trips";
        document.getElementById('trips').style.display = "none";

        // 初始化trips面板
        loop_time = LOOP_TIME; 
        document.getElementById('trips-time-slider').value = 0;
        document.getElementById('180').checked = 'checked';
        document.getElementById('trips-time-value').innerHTML = START_DATE;
        
        preTimestampToStartDate = 0; // 改变日期起点
    } 
});

// document.getElementById('load-buildings').addEventListener("click", function() {
//     isLoadBuildings = !isLoadBuildings;
//     if(isLoadBuildings){
//         loadBuildings();
//         document.getElementById('load-buildings').textContent = 'Unload Buildings';
//     } else {
//         removeBuildings();
//         document.getElementById('load-buildings').textContent = 'Load Buildings';
//     }
// })

function loadLayers() {

    // 为了渲染拖尾特效，添加5个点source，layer
    map.addSource('point0', {
        "type": "geojson",
        "data": setPointData([]),
    });

    map.addLayer({
        "id": "point0",
        "source": "point0",
        "type": "circle",
        'minzoom': 10,
        'maxzoom': 18,
        "paint": {
            "circle-radius": 2,
            'circle-color': ['get', 'color'],
            "circle-pitch-alignment": "viewport",
        }
    },firstBuildingLayerId);

    map.addSource('point1', {
        "type": "geojson",
        "data": setPointData([]),
    });

    map.addLayer({
        "id": "point1",
        "source": "point1",
        "type": "circle",
        'minzoom': 10,
        'maxzoom': 18,
        "paint": {
            "circle-radius": 2,
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.8,
            "circle-pitch-alignment": "viewport",
        }
    },firstBuildingLayerId);

    map.addSource('point2', {
        "type": "geojson",
        "data": setPointData([]),
    });

    map.addLayer({
        "id": "point2",
        "source": "point2",
        "type": "circle",
        'minzoom': 10,
        'maxzoom': 18,
        "paint": {
            "circle-radius": 2,
            'circle-color': ['get', 'color'],
            'circle-opacity': .6,
            "circle-pitch-alignment": "viewport",
        }
    },firstBuildingLayerId);

    map.addSource('point3', {
        "type": "geojson",
        "data": setPointData([]),
    });

    map.addLayer({
        "id": "point3",
        "source": "point3",
        "type": "circle",
        'minzoom': 10,
        'maxzoom': 18,
        "paint": {
            "circle-radius": 2,
            'circle-color': ['get', 'color'],
            'circle-opacity': .4,
            "circle-pitch-alignment": "viewport",
        }
    },firstBuildingLayerId);

    map.addSource('point4', {
        "type": "geojson",
        "data": setPointData([]),
    });

    map.addLayer({
        "id": "point4",
        "source": "point4",
        "type": "circle",
        'minzoom': 10,
        'maxzoom': 18,
        "paint": {
            "circle-radius": 2,
            'circle-color': ['get', 'color'],
            'circle-opacity': .2,
            "circle-pitch-alignment": "viewport",
        }
    },firstBuildingLayerId);

    // 通过线实现拖尾特效。添加线source，layer
    map.addSource('line', {
        "type": "geojson",
        "data": setLineData([]),
        "lineMetrics": true,
    });

    map.addLayer({
        "id": "line",
        "source": "line",
        "type": "line",
        "layout": {
            "line-cap": "round",
        },
        "paint": {
            "line-color": ["get", "color"],
            "line-width": 8,
            // 'line-gradient': [
            //     'interpolate',
            //     ['linear'],
            //     ['line-progress'],
            //     0, "white",
            //     1, ["get", "color"]
            // ],
        },
    },firstBuildingLayerId);

    // // 添加building3D source
    // for(var i=1;i<=9;i++){
    //     var xixi='L'+i.toString();
    //     var minLevel=16-0.5*i;
    //     var maxLevel=16.5-0.5*i;
    //     if(i==1){maxLevel=18}
    //     if(i==9){minLevel=10}
    //     map.addSource(xixi, constructSource(xixi));
    // }    
}

function setPointData(points){
    geojson.features.splice(0, geojson.features.length);
    
    for(var i = 0; i < points.length; i++){
        
        var feature = {
            "type": "Feature",
            "properties": {
                "color": points[i].color,
                "index": points[i].index,
            },
            "geometry": {
                "type": "Point",
                "coordinates": points[i].point,
            }
        }
        geojson.features.push(feature);
    }
    return geojson;
};

function setLineData(lines){
    geojson.features.splice(0, geojson.features.length);
    
    for(var i = 0; i < lines.length; i++){
        
        var feature = {
            "type": "Feature",
            "properties": {
                "color": lines[i].color,
                "index": lines[i].index,
            },
            "geometry": {
                "type": "LineString",
                "coordinates": lines[i].points,
            },
        }
        geojson.features.push(feature);
    }
    return geojson;
};

// function constructSource(mySource){
//     return {
//         'type':'vector',
//             'scheme':'tms',
//             'tiles':['http://120.79.207.10:8090/geoserver/gwc/service/tms/1.0.0/moreLevel%3A'+mySource+'@EPSG:900913@pbf/{z}/{x}/{y}.pbf']
//     };
// }

// function constructLayer(myId,mySource,myLayer,myMin,myMax){
//     return {
//         'id': myId,
//         'source': mySource,
//         'source-layer': myLayer,
//         'type': 'fill-extrusion',
//         'minzoom': myMin,
//         'maxzoom': myMax,
//         'paint': {
//             'fill-extrusion-color': [//'rgb(74, 80, 87)',[
//                 'interpolate',
//                 ['linear'],
//                 ['get', 'height'],
//                 0, 'rgb(255,255,191)',
//                 75, 'rgb(253,174,97)',
//                 150, "rgb(215,25,28)",
//             ],
//             'fill-extrusion-height': ['get', 'height'],
//             'fill-extrusion-opacity': .8,
//         }
//     }
// }

// 时间戳转时间
function timestampToTime(timestamp) {
    var date = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
    Y = date.getFullYear() + '-';
    M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
    D = date.getDate() + ' ';
    h = date.getHours() + ':';
    m = date.getMinutes() + ':';
    s = date.getSeconds();
    return Y+M+D+h+m+s;
}

function changePointSize(size) {
    map.setPaintProperty('point0', 'circle-radius', size);
    map.setPaintProperty('point1', 'circle-radius', size)
    map.setPaintProperty('point2', 'circle-radius', size)
    map.setPaintProperty('point3', 'circle-radius', size)
    map.setPaintProperty('point4', 'circle-radius', size)
}

// 滚轮wheel触发的事件, 改变速度，point大小
function changeSliderValue(zoom) {
    preTimestamp1 = preTimestamp;
    preTimestampToStartDate1 = preTimestampToStartDate;

    if(zoom < 11) {
        loop_time = LOOP_TIME;
        document.getElementById('180').checked = 'checked';

        changePointSize(2);                
    }
    if(zoom >= 11 && zoom < 13) {
        loop_time = LOOP_TIME * 2;
        document.getElementById('90').checked = 'checked';

        changePointSize(3);
    }
    if(zoom >= 13 && zoom < 15) {
        loop_time = LOOP_TIME * 3;
        document.getElementById('60').checked = 'checked';

        changePointSize(4);
    }
    if(zoom >= 15 && zoom < 17) {
        loop_time = LOOP_TIME * 6;
        document.getElementById('30').checked = 'checked';

        changePointSize(5);
    }
    if(zoom >= 17) {
        loop_time = LOOP_TIME * 12;
        document.getElementById('15').checked = 'checked';

        changePointSize(6);
    }
}

function loadTrips() {
    $.ajaxSettings.async = false; // 同步
    $.getJSON("data/shanghai7h-12h.txt", function(data)
    {
        data.forEach(function(pts, index) {  // pts代表一条轨迹线的点
            var pathPoints = {}; // 一条轨迹线的点对象
            pathPoints.color = "";
            pathPoints.points = [];
            pathPoints.id = "";

            var red = parseInt(Math.random() * 255); //parseInt(10 + 245 * (index / tarr.length));
            var green = parseInt(Math.random() * 255);
            var blue = parseInt(Math.random() * 255); 
            var color = "rgb(" + red + "," + green + "," + blue + ")";
            pathPoints.color = color;

            for (var i = 0; i < pts.length; i++) {
                pathPoints.id = pts[i].carID;

                var lon1 = pts[i].lon;
                var lon = parseFloat(lon1);
                var lat1 = pts[i].lat;
                var lat = parseFloat(lat1);

                var startTime = new Date(START_DATE).getTime();
                var time = new Date(pts[i].time).getTime();
                var betweenTime = (time - startTime) / 1000; // 单位s
                
                pathPoints.points.push([lon, lat, betweenTime]);
            }
            trips.push(pathPoints);
        });
        data.splice(0, data.length);
    })
}

// function loadBuildings() {
//     for(var i=1;i<=9;i++){
//         var xixi='L'+i.toString();
//         var minLevel=16-0.5*i;
//         var maxLevel=16.5-0.5*i;
//         if(i==1){maxLevel=18}
//         if(i==9){minLevel=10}
//         map.addLayer(constructLayer(xixi,xixi,xixi,minLevel,maxLevel))//, firstSymbolId)
//     }    
// }

// function removeBuildings() { 
//     for(var i=1;i<=9;i++){
//         var xixi='L'+i.toString();
//         var minLevel=16-0.5*i;
//         var maxLevel=16.5-0.5*i;
//         if(i==1){maxLevel=18}
//         if(i==9){minLevel=10}
//         map.removeLayer(xixi);
//     }    
// }

// 根据zoom设置distance
function setDistance(zoom) {
    if(zoom < 11) {
        return 0.001
    }
    if(zoom >= 11 && zoom < 12) {
        return 0.001;
    }
    if(zoom >= 12 && zoom < 13) {
        return 0.0005;
    }
    if(zoom >= 13 && zoom < 14) {
        return 0.0001;
    }
    if(zoom >= 14 && zoom < 15) {
        return 0.00001;
    }
    if(zoom >= 15 && zoom < 16) {
        return 0.00001;
    }
    if(zoom >= 16) {
        return 0.00005;
    }
}

function animateTrips() {
    
    // 以两个相邻timestamp的点连成线
    function animate(timestamp) {  // timestamp(ms)

        var deltaTimestamp = timestamp - preTimestamp1; 
        var deltaTimestampToStartDate = deltaTimestamp / 1000 * (LOOP_LENGTH / loop_time);
        var timestampToStartDate = preTimestampToStartDate1 + deltaTimestampToStartDate;
    
        timestampToStartDate = timestampToStartDate % LOOP_LENGTH;
        
        // 改变trips面板
        var date = timestampToTime(new Date(START_DATE).getTime() + timestampToStartDate * 1000);
        
        document.getElementById("trips-time-value").innerHTML = date;
        document.getElementById('trips-time-slider').value = (timestampToStartDate / 60);
        
        // -----animate point,获得这一时刻的点数组
        var tempAnimatePoints0 = []; // 这一时刻的轨迹点
        var tempAnimatePoints1 = [];
        var tempAnimatePoints2 = [];
        var tempAnimatePoints3 = [];
        var tempAnimatePoints4 = [];

        var dis = setDistance(map.getZoom());
        for(var j = 0; j < trips.length; j++){ 
            for(var k = 0; k < trips[j].points.length; k++){

                if(trips[j].points[0][2] > timestampToStartDate){
                    break;
                }

                if(trips[j].points[trips[j].points.length - 1][2] < timestampToStartDate){
                    break;
                }

                if(trips[j].points[k][2] < timestampToStartDate){
                    continue;
                }

                if(trips[j].points[k][2] > timestampToStartDate){

                    var point = [];

                    var deltaX = trips[j].points[k][0] - trips[j].points[k - 1][0];
                    var deltaY = trips[j].points[k][1] - trips[j].points[k - 1][1];
                    
                    var ratio = (timestampToStartDate - trips[j].points[k - 1][2]) / (trips[j].points[k][2] - trips[j].points[k - 1][2]);
                
                    point.push(trips[j].points[k - 1][0] + deltaX * ratio);
                    point.push(trips[j].points[k - 1][1] + deltaY * ratio);
                    
                    var animatePoint = {};
                    animatePoint.index = j;
                    animatePoint.color = trips[j].color;

                    animatePoint.point = [];
                    animatePoint.point.push(point[0]);
                    animatePoint.point.push(point[1]);

                    tempAnimatePoints0.push(animatePoint);

                    var deltaX4;
                    var deltaY4;
                    var point1 = [];
                    var point2 = [];
                    var point3 = [];
                    var point4 = [];
                    if(Math.abs(point[0] - trips[j].points[k - 1][0]) < dis) {
                        deltaX4 = (point[0] - trips[j].points[k - 1][0]) / 4;
                        point1.push(point[0] - deltaX4);
                        point2.push(point[0] - deltaX4 * 2);
                        point3.push(point[0] - deltaX4 * 3);
                        point4.push(point[0] - deltaX4 * 4);
                    } else {
                        deltaX4 = dis / 4;
                        point1.push(point[0] - deltaX4);
                        point2.push(point[0] - deltaX4 * 2);
                        point3.push(point[0] - deltaX4 * 3);
                        point4.push(point[0] - deltaX4 * 4);
                    }

                    if(Math.abs(point[1] - trips[j].points[k - 1][1]) < dis) {
                        deltaY4 = (point[1] - trips[j].points[k - 1][1]) / 4;
                        point1.push(point[1] - deltaY4);
                        point2.push(point[1] - deltaY4 * 2);
                        point3.push(point[1] - deltaY4 * 3);
                        point4.push(point[1] - deltaY4 * 4);
                    } else {
                        deltaY4 = dis / 4;
                        point1.push(point[1] - deltaY4);
                        point2.push(point[1] - deltaY4 * 2);
                        point3.push(point[1] - deltaY4 * 3);
                        point4.push(point[1] - deltaY4 * 4);
                    }

                    
                    var animatePoint1 = {};
                    animatePoint1.index = j;
                    animatePoint1.color = trips[j].color;
                    animatePoint1.point = point1;
                    tempAnimatePoints1.push(animatePoint1);
//console.log(tempAnimatePoints1);
                    var animatePoint2 = {};
                    animatePoint2.index = j;
                    animatePoint2.color = trips[j].color;
                    animatePoint2.point = point2;
                    tempAnimatePoints2.push(animatePoint2);

                    var animatePoint3 = {};
                    animatePoint3.index = j;
                    animatePoint3.color = trips[j].color;
                    animatePoint3.point = point3;
                    tempAnimatePoints3.push(animatePoint3);

                    var animatePoint4 = {};
                    animatePoint4.index = j;
                    animatePoint4.color = trips[j].color;
                    animatePoint4.point = point4;
                    tempAnimatePoints4.push(animatePoint4);

                    break;
                }
            }
        }

        // -----如果不显示拖尾特效执行
        //map.getSource('point0').setData(setPointData(tempAnimatePoints));

        // -----如果显示拖尾特效执行
        animatePoints.splice(0, animatePoints.length);
        animatePoints.push(tempAnimatePoints0);
        animatePoints.push(tempAnimatePoints1);
        animatePoints.push(tempAnimatePoints2);
        animatePoints.push(tempAnimatePoints3);
        animatePoints.push(tempAnimatePoints4);
        console.log(animatePoints);
        // if(animatePoints.length === 6) {
        //     animatePoints = animatePoints.splice(1, 5);
        // }
        
        var k = 0;
        //for(var j = animatePoints.length - 1; j >= 0; j--) {
            map.getSource('point0').setData(setPointData(animatePoints[0]));
            map.getSource('point1').setData(setPointData(animatePoints[1]));
            map.getSource('point2').setData(setPointData(animatePoints[2]));
            map.getSource('point3').setData(setPointData(animatePoints[3]));
            map.getSource('point4').setData(setPointData(animatePoints[4]));
            //k++;
        //}

        // 将参数导出
        preTimestampToStartDate = timestampToStartDate;
        preTimestamp = timestamp;
        
        animateId = requestAnimationFrame(animate);
    }

    animate(0);
}

// 点击trips-btn触发,渲染全部轨迹线
function startAnimateTrips() {
    isAnimateTrips = !isAnimateTrips;

    if(isAnimateTrips){
        // 改变trips面板
        var radios = document.getElementsByName('speed');
        for(var j = 0; j < radios.length; j++) {
            radios[j].disabled = false;
        }
        document.getElementById('trips-btn').innerHTML = "stop";
        document.getElementById('trips-time-slider').disabled = false;
        
        // 调用animateTrips()
        preTimestamp1 = window.performance.now(); // 改变真实时间起点
        preTimestampToStartDate1 = preTimestampToStartDate; // 改变日期起点
        animateTrips();
    } else {
        // 改变trips面板
        var radios = document.getElementsByName('speed');
        for(var j = 0; j < radios.length; j++) {
            radios[j].disabled = true;
        }
        document.getElementById('trips-btn').innerHTML = "start";
        document.getElementById('trips-time-slider').disabled = true;

        // 暂停动画
        window.cancelAnimationFrame(animateId);
    }
}

function changeTripsSpeed(e) {
    // 改变参数
    preTimestamp1 = preTimestamp;
    preTimestampToStartDate1 = preTimestampToStartDate;

    loop_time = LOOP_TIME * (180 / e.target.value);
}

function changeTripsTime(e) {
    // 改变参数
    preTimestamp1 = preTimestamp;
    preTimestampToStartDate1 = e.target.value * 60;
}