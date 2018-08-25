var example23DLayerName = 'shanghai_L1_geojson';//只对上海L1做了二三维混搭，矢量瓦片setfeaturestate时找不到id
var example23DData = './data/shanghai_L1_clip.geojson';
var example23DDataAfter;//对原始geojson做处理加上id，方便setfeaturestate
var bottomLine, verticalDistance;

document.getElementById("23D").addEventListener("change", function () {
    if (this.checked===true) {
        if (document.getElementById("3dbuildings").checked == true) { 
            document.getElementById("3dbuildings").click();//关闭瓦片的建筑，显示geojson的建筑
        }
        map.jumpTo({
            center: [121.380146, 31.181931],//目前只是clip了一个片区来做
            zoom: 17,
            pitch:60
        });
        
        $.ajaxSettings.async = false; //同步
        $.getJSON(example23DData, function (data) {
            var i = 1;
            data.features.forEach(function (item, index) {
                item.id = i;
                i++;
            });
            example23DDataAfter = data;
        });
        
        map.addSource(example23DLayerName, {
            'type': 'geojson',
            'data': example23DDataAfter
        });
        map.addLayer({
            'id': example23DLayerName,
            'type': 'fill-extrusion',
            'source': example23DLayerName,
            'paint': {
                'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'height'],
                    0, 'rgb(255,255,191)',
                    75, 'rgb(253,174,97)',
                    150, "rgb(215,25,28)",
                ],
                'fill-extrusion-height': ["get", "height"],
                'fill-extrusion-opacity': 0.8//该属性针对图层，不能控制到每个要素，否则可以做个渐变
            }
        });

        map.on('move', changeHeight);
    } else { 
        //flag23D = false;
        map.removeLayer(example23DLayerName);
        map.removeSource(example23DLayerName);        
        map.off('move', changeHeight);
    }
});

var isFirst=true;
function callback23DData(e) {        
    if (isFirst && e.sourceId === example23DLayerName && e.isSourceLoaded === true) {
        var features = map.queryRenderedFeatures({ layers: [example23DLayerName] });
        if (!features.length) {
            return;
        }
        console.log('23d source loaded!');
        isFirst=false;
        changeHeight();
        map.setPaintProperty(example23DLayerName, "fill-extrusion-height", ["feature-state", "height"]);
    }
}
map.on('sourcedata', callback23DData);

//鼠标移动时把近的放高远的放低接近二维
function changeHeight() { 
    var features = map.queryRenderedFeatures({ layers: [example23DLayerName] });
    console.log(features.length);
    updateBottomLine();
    features.forEach((item) => {
        var scale = compute23DScale(item);
        var height = 5 * item.properties.height * scale;//稍微放大点突出差异
        map.setFeatureState({ source: example23DLayerName, id: item.id }, { height: height });
    });
}

//更新底线的位置，方便计算建筑的远近
function updateBottomLine() { 
    var mapSize=map._containerDimensions();
    var screenX=mapSize[0];
    var screenY = mapSize[1];
    var topLeft = map.unproject([0, 0]);
    var bottomLeft = map.unproject([0, screenY]);
    var bottomRight = map.unproject([screenX, screenY]);
    var from = turf.point([topLeft.lng, topLeft.lat]);
    var to = turf.point([bottomLeft.lng, bottomLeft.lat]);
    
    verticalDistance = turf.distance(from, to);    
    bottomLine = turf.lineString([[bottomLeft.lng, bottomLeft.lat], [bottomRight.lng, bottomRight.lat]])
}

//计算缩放比例
function compute23DScale(feature) {
    var polygon = turf.polygon(feature.geometry.coordinates);
    var centroid = turf.centroid(polygon).geometry.coordinates;
    //centroid = [feature.properties.POINT_X, feature.properties.POINT_Y];//提前处理好，属性增加个位置更方便
    var nearestPoint = turf.nearestPointOnLine(bottomLine, centroid).geometry.coordinates;
    var from = turf.point(nearestPoint);
    var to=turf.point(centroid)
    var distance = turf.distance(from, to);
    var scale = 1- distance / verticalDistance;
    return scale*scale;//平方，拉大差异
}