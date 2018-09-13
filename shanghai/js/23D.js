//只对上海L1做了二三维混搭，矢量瓦片setfeaturestate时找不到id
var _23DLayerName = 'shanghai_L1_geojson';
var _23DData = './data/shanghai_L1_clip.geojson';

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
        
        map.addSource(_23DLayerName, {
            'type': 'geojson',
            'data': _23DData,
            'generateId': true//用于setfeaturestate
        });
        
        map.addLayer({
            'id': _23DLayerName,
            'type': 'fill-extrusion',
            'source': _23DLayerName,
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

        map.addLayer({
            'id': 'opacityTransitionLayer',
            'type': 'fill',
            'source': _23DLayerName,
            'paint': {
                'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'height'],
                    0, 'rgb(255,255,191)',
                    75, 'rgb(253,174,97)',
                    150, "rgb(215,25,28)",
                ],
            }
        })

        map.on('move', changeHeight);
    } else {
        map.removeLayer("opacityTransitionLayer");
        map.removeLayer(_23DLayerName);
        map.removeSource(_23DLayerName);        
        map.off('move', changeHeight);
        _23DDataFirstLoaded = true;
    }
});

var _23DDataFirstLoaded=true;
function callback23DData(e) {        
    if (_23DDataFirstLoaded && e.sourceId === _23DLayerName && e.isSourceLoaded === true) {
        var features = map.queryRenderedFeatures({ layers: [_23DLayerName] });
        if (!features.length) {
            return;
        }
        console.log('23d source loaded!');
        _23DDataFirstLoaded=false;
        changeHeight();
        map.setPaintProperty(_23DLayerName, "fill-extrusion-height", ["feature-state", "height"]);
        map.setPaintProperty("opacityTransitionLayer", "fill-opacity", ["feature-state", "opacity"]);
    }
}
map.on('sourcedata', callback23DData);

//鼠标移动时把近的放高远的放低接近二维
function changeHeight() { 
    var features = map.querySourceFeatures(_23DLayerName);
    var _3dFilteredId = ["in", "OBJECTID"];
    //var _2dFilteredId = ["in", "OBJECTID"];
    features.forEach((feature) => {
        var {heightScale,opacityScale} = compute23DScale(feature);
        if (heightScale > 0) { 
            var height = feature.properties.height * heightScale;
            map.setFeatureState({ source: _23DLayerName, id: feature.id }, { height: height });
            _3dFilteredId.push(feature.properties.OBJECTID);
        }
        // if (opacityScale > 0) { 
        //     map.setFeatureState({ source: _23DLayerName, id: feature.id }, { opacity: opacityScale });
        //     _2dFilteredId.push(feature.properties.OBJECTID);
        // }
        map.setFeatureState({ source: _23DLayerName, id: feature.id }, { opacity: opacityScale });
    });
    map.setFilter(_23DLayerName, _3dFilteredId);
    //map.setFilter("opacityTransitionLayer", _2dFilteredId);
}

//计算缩放比例
function compute23DScale(feature) {
    var polygon = turf.polygon(feature.geometry.coordinates);
    var centroid = turf.centroid(polygon).geometry.coordinates;
    //centroid = [feature.properties.POINT_X, feature.properties.POINT_Y];//用提前处理好的
    var screenPoint = map.project(centroid);
    var scale = 1 - screenPoint.y / map._containerDimensions()[1];
    var heightScale = heightTransition(scale);
    var opacityScale = opacityTransition(scale);
    return {
        heightScale: heightScale,
        opacityScale:opacityScale
    };
}

//近的三维，真实高度，远的二维，高度为0，中间过渡
function heightTransition(x) {
    if (x >= 0.6) {
        return 0;
    } else if (x <= 0.5) {
        return 1;
    } else { 
        return -10 * x + 6;
    }
}

function opacityTransition(x) { 
    if (x > 0.6 && x < 0.7) {
        return -10 * x + 7;
    } else { 
        return 0;
    }
}