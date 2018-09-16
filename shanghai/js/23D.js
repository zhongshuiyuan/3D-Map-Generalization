//TODO暂未考虑在二三维混搭的模式下缩放时换图层
var _23DLayerName;
document.getElementById("23D").addEventListener("change", function () {
    if (this.checked===true) {
        //map.zoomTo(17.1);放得越大二三维混搭效果越明显     
        // var levelNow = getLevelNow();
        // var cityNow = "shanghai"//TODO getCityNow();
        // _23DLayerName = cityNow + "_L" + levelNow;
        
        //由于fill-extrusion-opactiy不能data driven styling，用fill来做透明渐变的过渡 TODO放在对应的3d建筑下面
        // map.addLayer({
        //     'id': 'opacityTransitionLayer',
        //     'type': 'fill',
        //     'source': _23DLayerName,
        //     'source-layer':_23DLayerName,
        //     //TODO去获取对应的fill-extrusion图层并动态设置
        //     'paint': {
        //         'fill-color': [
        //             'interpolate',
        //             ['linear'],
        //             ['get', 'height'],
        //             0, 'rgb(255,255,191)',
        //             75, 'rgb(253,174,97)',
        //             150, "rgb(215,25,28)",
        //         ],
        //     }
        // })

        // var features = map.queryRenderedFeatures({ layers: [_23DLayerName] });
        // if (!features.length) {
        //     alert("当前位置没有显示建筑物，无法实现二三维混搭");
        //     return;
        // }

        changeHeight();
        map.setPaintProperty(_23DLayerName, "fill-extrusion-height", ["feature-state", "height"]);
        map.setPaintProperty("opacityTransitionLayer", "fill-opacity", ["feature-state", "opacity"]);

        map.on('move', changeHeight);
    } else {
        map.removeLayer("opacityTransitionLayer");        
        map.off('move', changeHeight);
        _23DDataFirstLoaded = true;
    }
});

//鼠标移动时调整过渡地带的建筑物的高度、透明度 可以改成根据坐标filter来提高速度
function changeHeight() {
    var levelNow = getLevelNow();
    var cityNow = "shanghai"//TODO getCityNow();
    _23DLayerName = cityNow + "_L" + levelNow;

    if (map.getLayer("opacityTransitionLayer").source !== _23DLayerName) {//缩放时跨越级别了，要重新加 
        map.removeLayer("opacityTransitionLayer");
    }
    if (!map.getLayer("opacityTransitionLayer")) { 
        map.addLayer({
            'id': 'opacityTransitionLayer',
            'type': 'fill',
            'source': _23DLayerName,
            'source-layer':_23DLayerName,
            //TODO去获取对应的fill-extrusion图层并动态设置
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
    }    

    var features = map.querySourceFeatures(_23DLayerName, {sourceLayer:_23DLayerName});
    var _3dFilteredId = ["in", "id"];
    var _2dFilteredId = ["in", "id"];
    var uniqueFeatures=getUniqueFeatures(features,'id');
    
    //修改geoserver后，仍有少部分要素缺少feature.id
    uniqueFeatures.forEach((feature) => { 
        if (isNaN(feature.id)) { 
            feature.id=feature.properties.id+1;
            console.log(feature);
        }           
    });
    
    //修改featurestate，高度和透明度，隐藏远的建筑
    uniqueFeatures.forEach((feature) => {
        var { heightScale, opacityScale } = compute23DScale(feature);
        if (heightScale > 0) { 
            var height = feature.properties.height * heightScale;
            map.setFeatureState({ source: _23DLayerName, sourceLayer:_23DLayerName, id: feature.id }, { height: height });
            _3dFilteredId.push(feature.properties.id);
        }
        map.setFeatureState({ source: _23DLayerName, sourceLayer:_23DLayerName, id: feature.id }, { opacity: opacityScale });
        if (opacityScale > 0) { 
            _2dFilteredId.push(feature.properties.id);
        }
    });
    //console.log(_3dFilteredId);
    map.setFilter(_23DLayerName, _3dFilteredId);
    map.setFilter("opacityTransitionLayer", _2dFilteredId);
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

//近的三维，真实高度，过渡地带高度逐渐降低接近0
function heightTransition(x) {
    if (x >= 0.6) {
        return 0;
    } else if (x <= 0.5) {
        return 1;
    } else { 
        return -10 * x + 6;
    }
}

//透明度从1过渡到0 TODO应该动态获取3d建筑的透明度，从这个透明度过渡到0
function opacityTransition(x) { 
    if (x > 0.6 && x < 0.7) {
        return -10 * x + 7;
    } else { 
        return 0;
    }
}

function getUniqueFeatures(array, comparatorProperty) {
    var existingFeatureKeys = {};
    var uniqueFeatures = array.filter(function(el) {
        if (existingFeatureKeys[el.properties[comparatorProperty]]) {
            return false;
        } else {
            existingFeatureKeys[el.properties[comparatorProperty]] = true;
            return true;
        }
    });
    return uniqueFeatures;
}

map.on('click', 'opacityTransitionLayer', function(e) {
    var features = map.queryRenderedFeatures(e.point);
    console.log(features[0]);
});