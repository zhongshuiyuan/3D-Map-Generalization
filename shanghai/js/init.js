///********************初始化地图，展示各个级别的建筑***********************/
//初始化地图
var positions = {
    guangzhou: [113.258713, 23.128997],
    shanghai: [121.444534,31.171876],
    nanjing: [118.790555, 32.053762],
    wuhan:[114.363068,30.532645]
};

mapboxgl.accessToken = 'pk.eyJ1IjoiYXJzbHh5IiwiYSI6ImNqZzRzemViajJ4MWUzM3Bjc3Z2M283ajMifQ.VuhGIVxu7Y9H7V4gUxTMdw';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/basic-v9',
    center: positions.shanghai,
    zoom: 14.5,
    pitch: 60,
    bearing: 0,
    hash: true,
});

var labelLayerId;//噪音在注记下面
var firstBuildingLayerId;//建筑里最先加进去的一个，轨迹线等在它下面
var layerZoom = [11, 12, 13, 14, 15, 15.5, 16, 16.5, 17, 22];//建筑九个级别对应的zoom范围，先认为每个城市一样

map.on('load', function () {
    //添加一些地图一加载时即显示的图层
    document.getElementById("3dbuildings").click();   
    //document.getElementById("road_noise").click();
    document.getElementById("cloudControl").click();
    addFlagForCities();
    addIndoorMap();    

    //找到注记和建筑图层id
    var allLayers = map.getStyle().layers;
    for (var i = 0; i < allLayers.length; i++) {
        if (allLayers[i].type === 'symbol' && allLayers[i].layout['text-field']) {
            labelLayerId = allLayers[i].id;
            break;
        }
    }
    for (var i = 0; i < allLayers.length; i++) {
        if (allLayers[i].type === 'fill-extrusion') {
            firstBuildingLayerId = allLayers[i].id;
            break;
        }
    }
});

//控制面板的显示和切换 关键是按钮和面板id的命名
var divMenu = document.getElementById("menu");
var buttonsInMenu = divMenu.getElementsByTagName("button");
for (let i = 0; i < buttonsInMenu.length; i++) {
    //只给那些用来打开更详细的控制面板的按钮加这个事件
    if (buttonsInMenu[i].className == "openPanel") { 
        buttonsInMenu[i].onclick = function (e) {
            var panelId = e.target.id + "Panel";
            var panel = document.getElementById(panelId);
            panel.style.display = panel.style.display === "block" ? "none" : "block";
            for (let j = 0; j < buttonsInMenu.length; j++) {
                if (j != i&&buttonsInMenu[j].className == "openPanel") {
                    panelId = buttonsInMenu[j].id + "Panel";
                    panel = document.getElementById(panelId);
                    panel.style.display = "none";
                }
            }
        }
    }    
}

//实时显示现在的缩放级别和显示的建筑图层
setInterval("changeInfo()",50);
function changeInfo(){
    var layerList = document.getElementById('xixi');
    var zoomNow = map.getZoom();
    var levelNow = 'none';
    for (var i = 0; i < layerZoom.length; i++) { 
        if (zoomNow > layerZoom[i]) { 
            levelNow = 9 - i;
        }
    }
    layerList.textContent="zoom:"+zoomNow.toFixed(1)+"     "+"layer:"+levelNow.toString();
}

//切换底图的风格 展示轨迹线可用暗的底图 TODO切换底图后添加的很多东西会消失
// var layerList = document.getElementById('baselayerControlPanel');
// var inputs = layerList.getElementsByTagName('input');
// function switchLayer(layer) {
//     var layerId = layer.target.id;
//     map.setStyle('mapbox://styles/mapbox/' + layerId + '-v9');
// }
// for (var i = 0; i < inputs.length; i++) {
//     inputs[i].onclick = switchLayer;
// }

//切换不同的城市
var cityPanel=document.getElementById("cityControlPanel");
var inputsCities=cityPanel.getElementsByTagName("input");
for (var i=0;i<inputsCities.length;i++){
    inputsCities[i].onclick=switchCity;
}
function switchCity(e) { 
    var city = e.target.value;
    switch (city) { 
        case "Shanghai":
            map.panTo(positions.shanghai);
            break;
        case "Nanjing":
            map.panTo(positions.nanjing);
            break;
        case "Guangzhou":
            map.panTo(positions.guangzhou);
            break;
        case "Wuhan":
            map.panTo(positions.wuhan);
            break;
        default:
            break;    
    }
}

//添加建筑物以及控制建筑物显示隐藏 TODO可能要改成切换到哪个城市再加载哪个城市的数据
var cbxBuildings = document.getElementById("3dbuildings");
cbxBuildings.addEventListener('click', function () {
    if (map.getSource("shanghai_L1") == undefined) {//TODO暂时写死了以后再改
        addBuildingForCity("shanghai");
        addBuildingForCity("guangzhou");
        addBuildingForCity("nanjing");
        addBuildingForCity("wuhan");
    }
    showOrHideBuildings("shanghai", this.checked);
    showOrHideBuildings("guangzhou", this.checked);
    showOrHideBuildings("nanjing", this.checked);
    showOrHideBuildings("wuhan", this.checked);
});

function showOrHideBuildings(cityName,showOrHide) { 
    for (var i = 1; i <= 9; i++) { 
        var xixi = cityName + '_L' + i.toString();
        map.setLayoutProperty(xixi, 'visibility', showOrHide?'visible':'none');       
    }
}

//换数据 每个级别的数据都添加进去
function addBuildingForCity(cityName) { 
    for (var i = 1; i <= 9; i++){
        var xixi=cityName+'_L'+i.toString();
        var minLevel = layerZoom[9 - i];//特定缩放级别对应特定数据
        var maxLevel = layerZoom[10 - i];
        map.addSource(xixi,constructSource(xixi));
        map.addLayer(constructLayer(xixi, xixi, xixi, minLevel, maxLevel));
    }
}

//根据图层名称，构造数据源
function constructSource(mySource){
    return   {
        'type':'vector',
        'scheme':'tms',
        'tiles':['http://'+config.hostName+'/geoserver/gwc/service/tms/1.0.0/moreLevel%3A'+mySource+'@EPSG:900913@pbf/{z}/{x}/{y}.pbf']
    };                
}

//构造图层，添加图层用，不同的缩放级别范围对应不同数据源
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
                20, 'rgb(253,174,97)',
                40, "rgb(215,25,28)",
            ],
            'fill-extrusion-height': ['get', 'height'],
            //对于较高的建筑，高度可以适当拔高，不一定要线性的
            // 'fill-extrusion-height': [
            //     'interpolate',
            //     ['linear'],
            //     ['get', 'height'],
            //     0, 0,
            //     20, 80,
            //     40, 240,
            //     75, 600
            // ],
            'fill-extrusion-opacity': 0.8,
        }
    };
}

//添加控件
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());
var language = new MapboxLanguage({
    defaultLanguage: 'zh'
});
map.addControl(language);

//做了三维建筑的城市用一个旗子标记
function addFlagForCities() {
    var cityCoordinates = [];
    for (var key in positions) { 
        cityCoordinates.push(positions[key]);
    }
    map.addSource("cityFlags", {
        "type": "geojson",
        "data": {
            "type": "MultiPoint",
            "coordinates": cityCoordinates
        }
    });    
    map.addLayer({
        "id": "cityFlags",
        "source": "cityFlags",
        "type": "symbol",
        "maxzoom":11,
        "layout": {
            "icon-image": "embassy-15",
            "icon-rotation-alignment": "map",
            "icon-size":3
        }
    });
}

//*****室内地图*******//
//创意城室内地图，添加一个隐藏的图层，鼠标点击就会显示室内地图
var indoorPopup;
function addIndoorMap() { 
    map.addSource("indoorMap", {
        type: "geojson",
        data: "./data/chuangyicheng.geojson"
    });
    map.addLayer({
        id: "indoorMap",
        source: "indoorMap",
        type: "fill-extrusion",//要点在平面的部分才会触发事件，以后的mapbox版本会修复
        paint: {
            "fill-extrusion-opacity": 0.0,
            "fill-extrusion-height": 50
        }
    });
    map.on('click', 'indoorMap', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';
        new mapboxgl.Popup({closeOnClick: false})
        .setLngLat([114.3508887547859,30.52887244911892])
        .setHTML('<div"><iframe src="amap_indoor.html" style="width:500px;height:300px;"></iframe></div>')
        .addTo(map);       
    });
}

//*******土地利用数据*******//
const landuseLayerName = "yangzhou_landuse";
document.getElementById("landuse").addEventListener('change', function () {
    if (!map.getSource(landuseLayerName)) {
        map.jumpTo({
            center:  [119.55169496501293, 32.33337104579164]
        });
        addLanduseData();
    }
    var visibility = this.checked ? "visible" : "none";
    map.setLayoutProperty(landuseLayerName, "visibility", visibility);
});

//添加三调数据
function addLanduseData() {
    //用矢量切片有缝隙，速度慢
    map.addSource(landuseLayerName, {
        'type':'vector',
        'scheme':'tms',
        'tiles':['http://'+config.hostName+'/geoserver/gwc/service/tms/1.0.0/general%3Ayangzhou_landuse@EPSG:900913@pbf/{z}/{x}/{y}.pbf']
    });
    map.addLayer({
        "id": landuseLayerName,
        "source": landuseLayerName,
        "source-layer": landuseLayerName,
        "type": "fill",
        "paint": {
            'fill-color': [
                'match',
                ['get', 'DLBM'],
                '0101', '#F8D072',
                '0102', '#FBE5AB',
                '0103', '#FFFFC8',
                '0201', '#D4A9CB',
                '0202', '#D5A7B0',
                '0204', '#D8BCD8',
                '0301', '#D5A7B0',
                '0304', '#32963C',
                '0306', '#6EC873',
                '0404', '#B7DCA0',
                '05', '#F3AE4A',
                '0602', '#C59A8C',
                '06H1', '#C59A8C',
                '0701', '#F06E7D',
                '0702', '#F06E7D',
                '0809', '#FFAAC8',
                '0810', '#81C35D',
                '08H1', '#FFAAC8',
                '08H2', '#FFAAC8',
                '08H2A', '#FFAAC8',
                '09', '#E77844',
                '1001', '#D1CFD6',
                '1002', '#B6B5B4',
                '1003', '#D2D8C9',
                '1004', '#C2C1C1',
                '1005', '#AAA9A9',
                '1007', '#E9817B',
                '1008', '#E9817B',
                '1101', '#A3D6F5',
                '1104', '#90AACF',
                '1106', '#D7FFFF',
                '1107', '#A0CDF0',
                '1109', '#E68264',
                '1201', '#E1DCE1',
                '1202', '#DCB482',
                '1203', '#B8C7E5',
                '201', '#E66776',
                '202', '#E66776',
                '203', '#EC8997',
                '204', '#C59A8C',
                '205', '#EC8997',
                /* other */ '#ccc'
            ],
            'fill-outline-color':'#111',
            'fill-opacity': 0.8
        }
    });
}