var flag23D = false;
var bottomLine, verticalDistance;
var example23DLayerName = 'shanghai_L1_geojson';
var example23DData = 'shanghai_L1_clip.geojson';
var example23DDataAfter;
document.getElementById("23D").addEventListener("click", function () {
    if (flag23D === false) { 
        flag23D = true;
        map.jumpTo({
            center: [121.386189, 31.178983],
            zoom: 19
        });
        $.ajaxSettings.async = false; // 同步
        $.getJSON(example23DData, function (data) {
            var i = 1;
            data.features.forEach(function (item, index) {
                item.id = i;
                i++;
            });
            example23DDataAfter = data;
        });
        map.addSource(example23DLayerName,{
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
                'fill-extrusion-opacity': 0.8//该属性针对图层，不能控制到每个要素
            }
        });
        
        //建筑物加载完成后遍历每个建筑，设置height这一feature-state，方便以后控制高度
        map.on("sourcedata",function(e){
            if (e.source.data===file&&e.sourceDataType!=="metadata"&&map.isFirst===undefined){
                //注意：这里只能获取viewport范围内的要素，一开始的zoom要够大
                map.isFirst=true;//if里面的步骤只执行一次 还有别的办法吧，这种不好
                var features=map.querySourceFeatures(example23DData);//注意：是source的id，不是Layer的
                if (features) {
                    var uniqueFeatures = getUniqueFeatures(features, "OBJECTID");
                    //根据id，给每个要素设置一个高度，真实高度或0
                    for (var i in uniqueFeatures){
                        var height=uniqueFeatures[i].properties.height;
                        var id=uniqueFeatures[i].properties.OBJECTID;
                        map.setFeatureState({source: example23DData, id: id},{ height: height});
                    }
                }
                changeHeight();        
                //map.setPaintProperty(example23DLayerName,"fill-extrusion-height",["feature-state", "height"])
            }    
        });
        map.setPaintProperty(example23DLayerName,"fill-extrusion-height",["feature-state", "height"])
    }
});

map.on('move', function () {
    if (flag23D == true&&map.getSource(example23DLayerName) && map.isSourceLoaded(example23DLayerName) === true) { 
        changeHeight();
    }  
});

function changeHeight() { 
    var features = map.queryRenderedFeatures({ layers: [example23DLayerName] });
    updateBottomLine();
    features.forEach((item, index) => {
        var scale = compute23DScale(item);
        var height = 5*item.properties.height * scale;
        //  console.log(item.properties.height,scale);
        map.setFeatureState({ source: example23DLayerName, id: item.id }, { height: height });
    });
}

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

function compute23DScale(feature) {
    var polygon = turf.polygon(feature.geometry.coordinates);
    var centroid = turf.centroid(polygon).geometry.coordinates;
    //centroid = [feature.properties.POINT_X, feature.properties.POINT_Y];
    var nearestPoint = turf.nearestPointOnLine(bottomLine, centroid).geometry.coordinates;
    var from = turf.point(nearestPoint);
    var to=turf.point(centroid)
    var distance = turf.distance(from, to);
    var scale = 1- distance / verticalDistance;
    return scale*scale;
}