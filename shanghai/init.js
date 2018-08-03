///********************初始化地图，展示各个级别的建筑***********************/
//根据图层名称，如L1-L9，构造数据源
function constructSource(mySource){
    return   {
        'type':'vector',
            'scheme':'tms',
            'tiles':['http://localhost:8080/geoserver/gwc/service/tms/1.0.0/moreLevel%3A'+mySource+'@EPSG:900913@pbf/{z}/{x}/{y}.pbf']
    };                
}

//构造图层，添加图层用，根据不同的缩放级别选择不同数据源
function constructLayer(myId,mySource,myLayer,myMin,myMax){
    return {
        'id': myId,
        'source': mySource,
        'source-layer': myLayer,
        'type': 'fill-extrusion',
        'minzoom': myMin,
        'maxzoom': myMax,
        'paint': {
            'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0, 'rgb(255,255,191)',
                75, 'rgb(253,174,97)',
                150, "rgb(215,25,28)",
            ],
            //'fill-extrusion-height': ['get', 'height'],
            //对于较高的建筑，高度可以适当拔高，不一定要线性的
            'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0, 0,
                75, 200,
                150, 600,
            ],
            'fill-extrusion-opacity': 0.8,
        }
    }
};

//实时显示现在的缩放级别和使用的建筑图层
function changeInfo(){
    var layerList = document.getElementById('xixi');
    var zoomNow=map.getZoom();
    var levelNow=parseInt((16-zoomNow)*2)+1
    if(levelNow<1){levelNow=1}
    else if(levelNow>9){levelNow=9}
    layerList.textContent="zoom:"+zoomNow.toFixed(1)+"     "+"layer:"+levelNow.toString();
}

//初始化地图
mapboxgl.accessToken = 'pk.eyJ1IjoiYXJzbHh5IiwiYSI6ImNqZzRzemViajJ4MWUzM3Bjc3Z2M283ajMifQ.VuhGIVxu7Y9H7V4gUxTMdw';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/basic-v9',
    center: [121.48529,31.25316],
    zoom: 13.8,
    pitch: 50,
    bearing: 0,
    hash: true,
});

var labelLayerId="shanghai_L1";
// function getLabelLayerId() { 
//     var layers = map.getStyle().layers;
//     var labelLayerId;
//     //示例代码在这里有问题，去掉layers[i].layout['text-field']并倒序
//     for (var i = layers.length-1; i >= 0; i--) {
//         if (layers[i].type === 'symbol') {
//             labelLayerId = layers[i].id;
//             break;
//         }
//     }
//     return labelLayerId;
// }

//这是别人做好的噪音地图
// mapboxgl.accessToken = 'pk.eyJ1IjoibW9yZ2Vua2FmZmVlIiwiYSI6IjIzcmN0NlkifQ.0LRTNgCc-envt9d5MzR75w';
// var map = new mapboxgl.Map({
//     container: 'map',
//     style: 'mapbox://styles/morgenkaffee/cimi6phf0007wcem3cyr9cl3o',//光替换这个没用token也要换成对应的
//     center: [121.48529,31.25316],
//     zoom: 13.8,
//     pitch: 50,
//     bearing: 0,
//     hash: true,
// });

//切换底图的风格 展示轨迹线用暗的底图
var layerList = document.getElementById('menu');
var inputs = layerList.getElementsByTagName('input');
function switchLayer(layer) {
    var layerId = layer.target.id;
    map.setStyle('mapbox://styles/mapbox/' + layerId + '-v9');
}
for (var i = 0; i < inputs.length; i++) {
    inputs[i].onclick = switchLayer;
}

//换数据 每个级别的数据都添加进去
map.on('styledata', function() {
    // map.addSource('paraGeneral',dicSource['paraGeneral']);
    for(var i=1;i<=9;i++){
        var xixi='shanghai_L'+i.toString();
        var minLevel=16-0.5*i;//特定缩放级别对应特定数据
        var maxLevel=16.5-0.5*i;
        if(i==1){maxLevel=22}
        if(i==9){minLevel=10}
        map.addSource(xixi,constructSource(xixi));
        map.addLayer(constructLayer(xixi, xixi, xixi, minLevel, maxLevel));
    }
});

map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());

setInterval("changeInfo()",50);
// map.on('wheel', function () {
//     var layerList = document.getElementById('xixi');
//     var zoomNow=map.getZoom();
//     var levelNow=parseInt((16-zoomNow)/0.5)+1
//     if(levelNow<1){levelNow=1}
//     else if(levelNow>9){levelNow=9}
//     layerList.textContent="zoom:"+zoomNow.toFixed(1)+"name:"+levelNow.toString();
// });

///********************控制噪音、光照、云雾等***********************/
//控制面板的显示和切换 关键是按钮和面板id的命名
var menu = document.getElementById("menu");
var buttons = menu.getElementsByTagName("button");
for (let i = 0; i < buttons.length; i++) {
    buttons[i].onclick = function (e) {
        var panelId = e.target.id + "Panel";
        var panel = document.getElementById(panelId);
        panel.style.display = panel.style.display === "block" ? "none" : "block";
        for (let j = 0; j < buttons.length; j++) {
            if (j != i) {
                panelId = buttons[j].id + "Panel";
                panel = document.getElementById(panelId);
                panel.style.display = "none";
            }
        }
    }
}

//添加源和图层并控制图层的显示隐藏
function controlLayerVisibility(elementId, sourceId, sourceObj, layerId, layerObj, before) { 
    var toggle=document.getElementById(elementId);
    toggle.onclick=function(){
        if (map.getSource(sourceId)===undefined){
            map.addSource(sourceId, sourceObj);
        }
        if (map.getLayer(layerId)===undefined){
            map.addLayer(layerObj,before);
        }
        if (this.checked===true){
            map.setLayoutProperty(layerId,'visibility','visible');
        }else{
            map.setLayoutProperty(layerId,'visibility','none');
        }
    };
}

var noiseToggle = document.getElementById("road_noise");
noiseToggle.onclick = function () { 
    if (map.getSource("road_noise_32levels") === undefined) { 
        addNoise('road_noise_32levels', '32levels.png', 15.5, 17.5);
        addNoise('road_noise_16levels', '16levels.png', 13.5, 15.5);
        addNoise('road_noise_8levels', '8levels.png', 11.5, 13.5);
        addNoise('road_noise_4levels', '4levels.png', 10, 11.5);
    }
    if (this.checked===true){
        map.setLayoutProperty('road_noise_32levels', 'visibility', 'visible');
        map.setLayoutProperty('road_noise_16levels','visibility','visible');
        map.setLayoutProperty('road_noise_8levels', 'visibility', 'visible');
        map.setLayoutProperty('road_noise_4levels','visibility','visible');
    }else{
        map.setLayoutProperty('road_noise_32levels', 'visibility', 'none');
        map.setLayoutProperty('road_noise_16levels','visibility','none');
        map.setLayoutProperty('road_noise_8levels', 'visibility', 'none');
        map.setLayoutProperty('road_noise_4levels','visibility','none');
    }
}

function addNoise(id,url,minzoom,maxzoom) { 
    map.addSource(id, {
        type: 'image',
        url: url,//使用arcgis核密度做好的
        coordinates: [
            [121.3817, 31.2302],
            [121.4571, 31.2302],
            [121.4571, 31.1739],
            [121.3817, 31.1739]
        ]
    });
    map.addLayer({
        id: id,
        source: id,
        type: 'raster',
        minzoom: minzoom,
        maxzoom: maxzoom,
        paint: {
            'raster-opacity': 0.7
        }
    }, labelLayerId);
}

//道路噪音的热力图
// controlLayerVisibility("road_noise", "road_noise", {
//     type: 'image',
//     url: '32levels.png',//使用arcgis核密度做好的
//     coordinates: [
//         [121.3817, 31.2302],
//         [121.4571, 31.2302],
//         [121.4571, 31.1739],
//         [121.3817, 31.1739]
//     ]
// }, "road_noise", {
//     id: 'road_noise',
//     source: 'road_noise',
//     type: 'raster',
//     paint: {
//         'raster-opacity': 0.7
//     }
// }, labelLayerId);

//每段路有个噪音值的道路
controlLayerVisibility("noise_road", "noise_road", {
    "type": "geojson",
    "data": "noise_road.geojson"
}, "noise_road", {
    "id": "noise_road",
    "type": "line",
    "source": "noise_road",
    "layout": {
        "line-join": "round",
        "line-cap": "round"
    },
    "paint": {
        "line-color": [
            "interpolate",
            ["linear"],
            ["get", "decibel"],
            0, "rgb(255,255,0)",
            99, "rgb(255,0,0)"
        ],
        "line-width": 5
    }
}, labelLayerId);

//产生噪音的点
controlLayerVisibility("noise_point", "noise_point", {
    "type": "geojson",
    "data": "noisePoints.geojson"
}, "noise_point", {
    "id": "noise_point",
    "type": "circle",
    "source": "noise_point",
    "minzoom": 12,
    "paint": {
        // Size circle radius by decibal and zoom level
        "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12, [
                "interpolate",
                ["linear"],
                ["get", "decibel"],
                1, 1,
                100, 4
            ],
            16, [
                "interpolate",
                ["linear"],
                ["get", "decibel"],
                1, 1,
                100, 8
            ]
        ],
        // Color circle by decibel
        "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "decibel"],
            1, "rgba(33,102,172,0)",
            20, "rgb(103,169,207)",
            40, "rgb(209,229,240)",
            60, "rgb(253,219,199)",
            80, "rgb(239,138,98)",
            100, "rgb(178,24,43)"
        ],
        "circle-stroke-color": "white",
        "circle-stroke-width": 1
    }
}, labelLayerId);

//点构成的噪音热力图
controlLayerVisibility("point_noise", "noise_point", {
    "type": "geojson",
    "data": "noisePoints.geojson"//这里跟点图层共用一个source
}, "point_noise", {
    "id": "point_noise",
    "type": "heatmap",
    "source": "noise_point",
    "maxzoom": 20,
    "paint": {
        // Increase the heatmap weight based on decibel
        "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "decibel"],
            0, 1,
            100, 5
        ],
        // Increase the heatmap color weight weight by zoom level
        // heatmap-intensity is a multiplier on top of heatmap-weight
        "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 1,
            20, 1
        ],
        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        // Begin color ramp at 0-stop with a 0-transparancy color
        // to create a blur-like effect.
        "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(0, 255, 0, 0)",
            0.1, "rgb(0,255,0)",
            0.3, "rgb(125,255,0)",
            0.5, "rgb(255,255,0)",
            0.7, "rgb(255,128,0)",
            1, "rgb(255,0,0)"
        ],
        // Adjust the heatmap radius by zoom level
        "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0, 2,
            20, 25
        ],
    }
}, labelLayerId);

//光照相关控件加进来并绑定事件
var canvEl = document.getElementById('canv');
var widgetWidth = menu.offsetWidth-20;//本来源代码是canv.offsetWidth，由于一开始面板要隐藏，改为使用menu的宽度
var g = Globe()
    .color('rgba(255,255,255,0.8)')
    .lightColor('#86cfd2')
    .width(widgetWidth)
    .on('change', function(rotation) {
        map.setLight({
            position: rotation,
            'position-transition': {
                duration: 0
            }
        });
    });
d3.select('#canv')
    .append('div')
    .call(ColorPicker()
        .width(widgetWidth)
        .height(Math.min(widgetWidth, 150))
        .center('#86cfd2')
        .on('change', function(color) {
            g.lightColor(color);
            map.setLight({
                color: color,
                'color-transition': {
                    duration: 0
                }
            });
        }));
d3.select('#globe')
    .append('div')
    .call(g);
document.getElementById('intensity').addEventListener('input', function(e) {
    map.setLight({
        intensity: +e.target.value,
        'intensity-transition': {
            duration: 0
        }
    });
});

//地图加载时即显示的图层
map.on('load', function () {
    var cbxRoadNoise = document.getElementById("road_noise");
    cbxRoadNoise.click();
});  