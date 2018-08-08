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
                20, 'rgb(253,174,97)',
                40, "rgb(215,25,28)",
            ],
            //'fill-extrusion-height': ['get', 'height'],
            //对于较高的建筑，高度可以适当拔高，不一定要线性的
            'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['get', 'height'],
                0, 0,
                20, 80,
                40, 240,
                75, 600
            ],
            'fill-extrusion-opacity': 0.8,
        }
    }
};

//实时显示现在的缩放级别和使用的建筑图层
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

//初始化地图
var positions = {
    guangzhou: [113.25871364943879, 23.128997163128673],
    shanghai: [121.42658554279558, 31.162356610593136],
    nanjing: [118.79055594872085, 32.05376236060384],
    wuhan:[114.363068,30.532645]
};
mapboxgl.accessToken = 'pk.eyJ1IjoiYXJzbHh5IiwiYSI6ImNqZzRzemViajJ4MWUzM3Bjc3Z2M283ajMifQ.VuhGIVxu7Y9H7V4gUxTMdw';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v9',
    center: positions.shanghai,
    zoom: 13.8,
    pitch: 50,
    bearing: 0,
    hash: true,
});
var labelLayerId = "waterway-label";//暂时写死，以后再改成动态的,噪音在注记下面
var firstBuildingLayerId = "shanghai_L1";//建筑里最先加进去的一个，轨迹线等在它下面
var layerZoom = [11, 12, 13, 14, 15, 15.5, 16, 16.5, 17, 22];//建筑九个级别对应的zoom范围，先认为每个城市一样

//切换底图的风格 展示轨迹线用暗的底图
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

//添加一些地图一加载时即显示的图层
map.on('load', function () {    
    document.getElementById("3dbuildings").click();   
    document.getElementById("road_noise").click();
    addFlagForCities();
    addLanduseData();
    addIndoorMap();
});

//添加建筑物以及控制建筑物显示隐藏
var cbxBuildings = document.getElementById("3dbuildings");
cbxBuildings.addEventListener('click', function () {
    if (map.getSource("shanghai_L1") == undefined) {//TODO暂时写死了以后再改
        addBuildingForACity("shanghai");
        addBuildingForACity("guangzhou");
        addBuildingForACity("nanjing");
        addBuildingForACity("wuhan");
    }
    showOrHideBuildings("shanghai", this.checked);
    showOrHideBuildings("guangzhou", this.checked);
    showOrHideBuildings("nanjing", this.checked);
    showOrHideBuildings("wuhan", this.checked);
});
function showOrHideBuildings(cityName,showOrHide) { 
    for (var i = 1; i <= 9; i++) { 
        var xixi = cityName + '_L' + i.toString();
        if (showOrHide) {
            map.setLayoutProperty(xixi, 'visibility', 'visible');
        } else { 
            map.setLayoutProperty(xixi, 'visibility', 'none');
        }        
    }
}

//换数据 每个级别的数据都添加进去
function addBuildingForACity(cityName) { 
    for (var i = 1; i <= 9; i++){
        var xixi=cityName+'_L'+i.toString();
        var minLevel = layerZoom[9 - i];//特定缩放级别对应特定数据
        var maxLevel = layerZoom[10 - i];
        map.addSource(xixi,constructSource(xixi));
        map.addLayer(constructLayer(xixi, xixi, xixi, minLevel, maxLevel));
    }
}

map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());
var language = new MapboxLanguage({
    defaultLanguage: 'zh'
});
map.addControl(language);

//控制面板的显示和切换 关键是按钮和面板id的命名
var menu = document.getElementById("menu");
var buttons = menu.getElementsByTagName("button");
for (let i = 0; i < buttons.length; i++) {
    //只给那些用来打开更详细的控制面板的按钮加这个事件
    if (buttons[i].className == "openPanel") { 
        buttons[i].onclick = function (e) {
            var panelId = e.target.id + "Panel";
            var panel = document.getElementById(panelId);
            panel.style.display = panel.style.display === "block" ? "none" : "block";
            for (let j = 0; j < buttons.length; j++) {
                if (j != i&&buttons[j].className == "openPanel") {
                    panelId = buttons[j].id + "Panel";
                    panel = document.getElementById(panelId);
                    panel.style.display = "none";
                }
            }
        }
    }    
}

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

//创意城室内地图，添加一个隐藏的图层，放入鼠标就会显示室内地图
var indoorPopup;
function addIndoorMap() { 
    map.addSource("indoorMap", {
        type: "geojson",
        data: "chuangyicheng.geojson"
    });
    map.addLayer({
        id: "indoorMap",
        source: "indoorMap",
        type: "fill-extrusion",
        paint: {
            "fill-extrusion-opacity": 0.0,
            "fill-extrusion-height": 50
        }
    });
    map.on('click', 'indoorMap', function(e) {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';
        console.log(e);
        console.log(e.features);
        //创意城室内地图
        // new mapboxgl.Popup()
        //     .setLngLat(coordinates)
        //     .setHTML(description)
        //     .addTo(map);
        new mapboxgl.Popup({closeOnClick: false})
        .setLngLat([114.3508887547859,30.52887244911892])
        .setHTML('<div"><iframe src="amap_indoor.html" style="width:500px;height:300px;"></iframe></div>')
        .addTo(map);       
    });
    // map.on('mouseleave', 'indoorMap', function() {
    //     map.getCanvas().style.cursor = '';
    //     indoorPopup.remove();
    // });
}

//三调数据
function addLanduseData() { 
    map.addSource("yangzhou_landuse", {
        'type':'vector',
        'scheme':'tms',
        'tiles':['http://localhost:8080/geoserver/gwc/service/tms/1.0.0/general%3Ayangzhou_landuse@EPSG:900913@pbf/{z}/{x}/{y}.pbf']
    });
    map.addLayer({
        "id": "yangzhou_landuse",
        "source": "yangzhou_landuse",
        "source-layer":"yangzhou_landuse",
        "type": "fill",
        "paint": {
            'fill-color': '#088',
            'fill-opacity': 0.8
        }
    })
}