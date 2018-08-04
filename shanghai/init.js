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
mapboxgl.accessToken = 'pk.eyJ1IjoiYXJzbHh5IiwiYSI6ImNqZzRzemViajJ4MWUzM3Bjc3Z2M283ajMifQ.VuhGIVxu7Y9H7V4gUxTMdw';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/basic-v9',
    center: [121.42658554279558, 31.162356610593136],//南京118.79055594872085, 32.05376236060384//广州113.25871364943879, 23.128997163128673
    zoom: 13.8,
    pitch: 50,
    bearing: 0,
    hash: true,
});
var labelLayerId = "shanghai_L1";//建筑里最先加进去的一个，噪音等在它下面
var layerZoom = [11, 12, 13, 14, 15, 15.5, 16, 16.5, 17, 22];//建筑九个级别对应的zoom范围，先认为每个城市一样

//切换底图的风格 展示轨迹线用暗的底图
var layerList = document.getElementById('baselayerControlPanel');
var inputs = layerList.getElementsByTagName('input');
function switchLayer(layer) {
    var layerId = layer.target.id;
    map.setStyle('mapbox://styles/mapbox/' + layerId + '-v9');
}
for (var i = 0; i < inputs.length; i++) {
    inputs[i].onclick = switchLayer;
}

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
            map.panTo([121.42658554279558, 31.162356610593136]);
            break;
        case "Nanjing":
            map.panTo([118.79055594872085, 32.05376236060384]);
            break;
        case "Guangzhou":
            map.panTo([113.25871364943879, 23.128997163128673]);
            break;
        default:
            break;    
    }
}

//换数据 每个级别的数据都添加进去
map.on('styledata', function () {
    //上海
    for(var i=1;i<=9;i++){
        var xixi='shanghai_L'+i.toString();
        var minLevel = layerZoom[9 - i];//特定缩放级别对应特定数据
        var maxLevel = layerZoom[10 - i];
        map.addSource(xixi,constructSource(xixi));
        map.addLayer(constructLayer(xixi, xixi, xixi, minLevel, maxLevel));
    }
    //这里继续加其他城市
});

map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());
var language = new MapboxLanguage({
    defaultLanguage: 'zh'
});
map.addControl(language);

//地图加载时即显示的图层
map.on('load', function () {
    var cbxRoadNoise = document.getElementById("road_noise");
    cbxRoadNoise.click();
}); 

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