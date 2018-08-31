var multiScaleFlag = false;
var multiScaleMaxLayer = 3;//大于L3之后就回归正常显示
var toggleMultiScale = document.getElementById("startMultiScale").addEventListener('click', function () { 
    if (this.innerText === "关闭") { 
        //关闭多尺度展示
        this.innerText = "开始";
        multiScaleFlag = false;
        document.getElementById("multiScaleLayers").style.display = 'none';
        //回到正常的只展示一个图层，修改各个图层zoom的范围
        map.removeLayer('multiScaleBorder');
        map.removeSource('multiScaleBorder');
        for (var i = 0; i < layerZoom.length-1; i++) { 
            map.setLayerZoomRange("shanghai_L" + (9 - i), layerZoom[i], layerZoom[i + 1]);
            map.setFilter("shanghai_L" + (9 - i), null);
            //map.setPaintProperty("shanghai_L" + (9 - i), "fill-extrusion-height", ['get', 'height']);
        }
        return;
    }

    //打开多尺度展示
    multiScaleFlag = true;
    this.innerText = "关闭";
    document.getElementById("multiScaleLayers").style.display = 'block';
    //先决条件检查
    if (map.getZoom() < layerZoom[4]) { 
        //map.zoomTo(17);
    }
    if (map.getBearing() !== 0) { 
        map.setBearing(0);
    }
    //TODO 如果不在上海jumpTo上海
    //添加边界线图层
    map.addSource('multiScaleBorder',{
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[]]
            }
        }
    });
    map.addLayer({
        'id': 'multiScaleBorder',
        'type': 'line',
        'source':'multiScaleBorder',
        'minzoom':layerZoom[9-multiScaleMaxLayer],
        'layout': {},
        'paint': {
            'line-color': '#f00',
            'line-width': 3
        }
    });
    var levelNow = getLevelNow();
    updateLayerMessage(levelNow);
    changeBuildings();
});

map.on('move', function () { 
    if (!multiScaleFlag) return;

    var levelNow = getLevelNow();
    updateLayerMessage(levelNow);

    if (levelNow > multiScaleMaxLayer) { //回到正常的只显示一个图层
        for (var i = 0; i < layerZoom.length-1; i++) { 
            map.setLayerZoomRange("shanghai_L" + (9 - i), layerZoom[i], layerZoom[i + 1]);
            map.setFilter("shanghai_L" + (9 - i), null);
        }
        return;
    }
    changeBuildings();
});

function getLevelNow() { 
    var levelNow;
    for (var i = 0; i < layerZoom.length; i++) { 
        if (map.getZoom() > layerZoom[i]) { 
            levelNow = 9 - i;
        }
    }
    return levelNow;
}

function updateLayerMessage(levelNow) { 
    if (levelNow <= multiScaleMaxLayer) {
        var str = `layer${levelNow}、layer${levelNow + 2}、layer${levelNow + 4}混搭`;
        document.getElementById("multiScaleLayers").innerText = str;
    } else {
        var str = `layer${levelNow},放大至layer${multiScaleMaxLayer}开始多尺度展示`;
        document.getElementById("multiScaleLayers").innerText = str;
    }
}

//建筑的显示隐藏
function changeBuildings(){
    //计算所有边界线的x或y坐标
    var outerNW=screenToProject(1/8,1/4);
    var outerNE=screenToProject(7/8,1/4);
    var innerNW=screenToProject(1/4,1/2);
    var innerNE=screenToProject(3/4,1/2);
    var viewPoint=screenToProject(1/2,1);
    var outerN=outerNW[1];
    var outerS=viewPoint[1];
    var outerW=outerNW[0];
    var outerE=outerNE[0];
    var innerN=innerNW[1];
    var innerS=viewPoint[1];
    var innerW=innerNW[0];
    var innerE=innerNE[0];
    
    //根据当前的图层判断显示哪几个图层
    var levelNow, minZoom, maxZoom;
    for (var i = 0; i < layerZoom.length; i++) { 
        if (map.getZoom() > layerZoom[i]) { 
            levelNow = 9 - i;
            minZoom = layerZoom[i];
            maxZoom = layerZoom[i + 1];
        }
    }
    if (levelNow > multiScaleMaxLayer) return;
    var layerInner = "shanghai_L" + levelNow;
    var layerMiddle = "shanghai_L" + (levelNow + 2);
    var layerOuter = "shanghai_L" + (levelNow + 4);

    //修改各个图层的zoom范围
    map.setLayerZoomRange(layerInner, minZoom, maxZoom);
    map.setLayerZoomRange(layerMiddle, minZoom, maxZoom);
    map.setLayerZoomRange(layerOuter, minZoom, maxZoom);
    //二三维混搭
    // map.setPaintProperty(layerInner, "fill-extrusion-height", ['get', 'height']);
    // map.setPaintProperty(layerMiddle, "fill-extrusion-height", ['get', 'height']);
    // map.setPaintProperty(layerOuter, "fill-extrusion-height", 0);

    //设置显示隐藏
    map.setFilter(layerInner,["all",
            [">","x_join",innerW],
            ["<","x_join",innerE],
            [">","y_join",innerS],
            ["<","y_join",innerN]
        ]);
    map.setFilter(layerMiddle,['all',
        ["any",
        ["any",["<","x",innerW],[">","x",innerE]],
        [">","y",innerN]                
        ],
        ["all",
        [">","x_join",outerW],
        ["<","x_join",outerE],
        [">","y_join",outerS],
        ["<","y_join",outerN]
        ]
        ]);
    map.setFilter(layerOuter,["any",
        ["any",["<","x",outerW],[">","x",outerE]],
        [">","y",outerN]              
        ]);

    //更新分界线
    var nw=toWGS84(innerNW);
    var ne=toWGS84(innerNE);
    var sw=toWGS84([innerNW[0],viewPoint[1]]);
    var se=toWGS84([innerNE[0],viewPoint[1]]); 
    var nw2=toWGS84(outerNW);
    var ne2=toWGS84(outerNE);
    var sw2=toWGS84([outerNW[0],viewPoint[1]]);
    var se2=toWGS84([outerNE[0],viewPoint[1]]); 
    map.getSource("multiScaleBorder").setData({
        'type':'FeatureCollection',
        'features':[{
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[nw,ne,se,sw,nw]]
            }
        },{
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': [[nw2,ne2,se2,sw2,nw2]]
            }
        }
        ]
    });  
}

document.getElementById("multiScaleBorder").addEventListener('change',function(){
    map.setLayoutProperty("multiScaleBorder","visibility",this.checked?"visible":"none");
});

function toWGS84(arr){
    var pt = turf.point(arr);
    var converted = turf.toWgs84(pt);
    return converted.geometry.coordinates;
}

//根据在屏幕中的位置来计算对应点的投影坐标
function screenToProject(divisionX,divisionY){
    var mapSize=map._containerDimensions();
    var screenX=mapSize[0]*divisionX;
    var screenY=mapSize[1]*divisionY;
    var geoObj=map.unproject([screenX,screenY]);
    var geoArr=[geoObj.lng,geoObj.lat];
    var projected = turf.toMercator(turf.point(geoArr)).geometry.coordinates;
    return projected;
}