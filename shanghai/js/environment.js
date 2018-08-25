///********************控制噪音、光照、云雾等环境信息***********************/
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
        addNoise('road_noise_32levels', './data/road32.png', 16, 18);
        addNoise('road_noise_16levels', './data/road16.png', 14, 16);
        addNoise('road_noise_8levels', './data/road8.png', 12.5, 14);
        addNoise('road_noise_4levels', './data/road4.png', 11, 12.5);
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
            [121.2981, 31.2414],
            [121.4660, 31.2414],
            [121.4660, 31.1232],
            [121.2981, 31.1232]
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

// //动态符号
// document.getElementById("dynamic_symbol").addEventListener("click", toggleDynamicSymbol);
// const soundWaveFrameCount = 6;
// var soundWaveInterval;
// function toggleDynamicSymbol() {    
//     if (this.checked == true) {
//         dynamicSymbol();
//     } else {
//         clearInterval(soundWaveInterval);
//         for (var i = 0; i < soundWaveFrameCount; i++) { 
//             map.setPaintProperty('shengbo' + i, 'raster-opacity', 0);
//         }
//     }
// }
// function dynamicSymbol() {    
//     for (var i = 0; i < soundWaveFrameCount; i++) {
//         if (map.getSource("shengbo" + i) === undefined) { 
//             map.addSource("shengbo" + i, {
//                 type: 'image',
//                 url: 'shengbo/shengbo' + i + '.png',
//                 coordinates: [
//                     [121.4148, 31.1637],
//                     [121.4349, 31.1637],
//                     [121.4349, 31.1472],
//                     [121.4148, 31.1472]
//                 ]
//             });        
//             map.addLayer({
//                 id: 'shengbo' + i,
//                 source: 'shengbo' + i,
//                 type: 'raster',
//                 paint: {
//                     'raster-opacity': 0,
//                     'raster-opacity-transition': {
//                         duration: 0
//                     }
//                 }
//             });
//         }        
//     }

//     var frame = soundWaveFrameCount - 1;
//     soundWaveInterval=setInterval(function() {
//         map.setPaintProperty('shengbo' + frame, 'raster-opacity', 0);
//         frame = (frame + 1) % soundWaveFrameCount;
//         map.setPaintProperty('shengbo' + frame, 'raster-opacity', 1);
//     }, 200);
// }

// //每段路有个噪音值的道路
// controlLayerVisibility("noise_road", "noise_road", {
//     "type": "geojson",
//     "data": "noise_road.geojson"
// }, "noise_road", {
//     "id": "noise_road",
//     "type": "line",
//     "source": "noise_road",
//     "layout": {
//         "line-join": "round",
//         "line-cap": "round"
//     },
//     "paint": {
//         "line-color": [
//             "interpolate",
//             ["linear"],
//             ["get", "decibel"],
//             0, "rgb(255,255,0)",
//             99, "rgb(255,0,0)"
//         ],
//         "line-width": 5
//     }
//     }, labelLayerId);

// //产生噪音的点
// controlLayerVisibility("noise_point", "noise_point", {
//     "type": "geojson",
//     "data": "noisePoints.geojson"
// }, "noise_point", {
//     "id": "noise_point",
//     "type": "circle",
//     "source": "noise_point",
//     "minzoom": 12,
//     "paint": {
//         // Size circle radius by decibal and zoom level
//         "circle-radius": [
//             "interpolate",
//             ["linear"],
//             ["zoom"],
//             12, [
//                 "interpolate",
//                 ["linear"],
//                 ["get", "decibel"],
//                 1, 1,
//                 100, 4
//             ],
//             16, [
//                 "interpolate",
//                 ["linear"],
//                 ["get", "decibel"],
//                 1, 1,
//                 100, 8
//             ]
//         ],
//         // Color circle by decibel
//         "circle-color": [
//             "interpolate",
//             ["linear"],
//             ["get", "decibel"],
//             1, "rgba(33,102,172,0)",
//             20, "rgb(103,169,207)",
//             40, "rgb(209,229,240)",
//             60, "rgb(253,219,199)",
//             80, "rgb(239,138,98)",
//             100, "rgb(178,24,43)"
//         ],
//         "circle-stroke-color": "white",
//         "circle-stroke-width": 1
//     }
// }, labelLayerId);

// //点构成的噪音热力图
// controlLayerVisibility("point_noise", "noise_point", {
//     "type": "geojson",
//     "data": "noisePoints.geojson"//这里跟点图层共用一个source
// }, "point_noise", {
//     "id": "point_noise",
//     "type": "heatmap",
//     "source": "noise_point",
//     "maxzoom": 20,
//     "paint": {
//         // Increase the heatmap weight based on decibel
//         "heatmap-weight": [
//             "interpolate",
//             ["linear"],
//             ["get", "decibel"],
//             0, 1,
//             100, 5
//         ],
//         // Increase the heatmap color weight weight by zoom level
//         // heatmap-intensity is a multiplier on top of heatmap-weight
//         "heatmap-intensity": [
//             "interpolate",
//             ["linear"],
//             ["zoom"],
//             0, 1,
//             20, 1
//         ],
//         // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
//         // Begin color ramp at 0-stop with a 0-transparancy color
//         // to create a blur-like effect.
//         "heatmap-color": [
//             "interpolate",
//             ["linear"],
//             ["heatmap-density"],
//             0, "rgba(0, 255, 0, 0)",
//             0.1, "rgb(0,255,0)",
//             0.3, "rgb(125,255,0)",
//             0.5, "rgb(255,255,0)",
//             0.7, "rgb(255,128,0)",
//             1, "rgb(255,0,0)"
//         ],
//         // Adjust the heatmap radius by zoom level
//         "heatmap-radius": [
//             "interpolate",
//             ["linear"],
//             ["zoom"],
//             0, 2,
//             20, 25
//         ],
//     }
// }, labelLayerId);

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