var toggleMultiScale = document.getElementById("startMultiScale");
toggleMultiScale.onclick = function () {
    //关闭多尺度展示
    if (this.innerText === "关闭") { 
        this.innerText = "开始";
        multiScaleFlag = false;
        map.removeLayer("Manhattan-extrusion");
        map.removeLayer("view-point");
        map.removeLayer("farBuffer");
        map.removeLayer("closeBuffer");
        map.removeSource("Manhattan");
        map.removeSource("view-point");
        map.removeSource("farBuffer");
        map.removeSource("closeBuffer");        
        return;
    }

    //打开多尺度展示
    multiScaleFlag = true;
    this.innerText = "关闭";
    map.jumpTo({
        center: [-73.952, 40.782],
        zoom: 13.5,
        bearing: 30,
        pitch:60
        //专为曼哈顿而设
    });
    //初始化，添加建筑、中心点、缓冲区
    map.addSource('Manhattan',{
        'type': 'geojson',
        'data': file
    });
    map.addLayer({
        'id': 'Manhattan-extrusion',
        'type': 'fill-extrusion',
        'source': 'Manhattan',        
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
        },
    });
    // var divLoadingMessage=document.getElementById("loadingMessage");
    // divLoadingMessage.style.display="block";
    drawViewPointAndScope();

    //建筑物加载完成后遍历每个建筑，存入object里方便取
    map.on("sourcedata",function(e){
        var isFirst=true;
        if (e.source.data===file&&e.sourceDataType!=="metadata"&&isFirst===true){
            //注意：这里只能获取viewport范围内的要素，一开始的zoom要够大
            isFirst=false;//if里面的步骤只执行一次
            var features=map.querySourceFeatures('Manhattan');//注意：是source的id，不是Layer的
            if (features) {
                var uniqueFeatures = getUniqueFeatures(features, "OBJECTID");
                //根据id，给每个要素设置一个高度，一开始设成真实高度，后面根据需要设成0来隐藏
                for (var i in uniqueFeatures){
                    //把所有建筑存入buildingObj里 后面就是对他循环
                    key=uniqueFeatures[i].properties.id;
                    buildingObj[key]=uniqueFeatures[i];
                }
            }
            changeBuildings();
        }    
    });
};

var multiScaleFlag = false;
var file = "LOD_simplify_merge_child_id.geojson";
var filteredId = ["in", "OBJECTID"];//用这个来控制建筑显示隐藏
var buildingObj={};//存放所有建筑，key是id，方便访问
var farDis=1;//划分详细程度的距离，常量，km
var closeDis=0.5;
var viewPoint;//三种选项对应的三种缓冲区中心
var viewCenterLine;
var viewCurrentRoad;

// //实时查看地图是否动了 这个可以灵活控制多少毫秒刷新一次，比map.onmove好用
//用来比较位置是否有改变
// var oldPosition={
//     center:map.getCenter(),
//     zoom:map.getZoom(),
//     pitch:map.getPitch(),
//     bearing:map.getBearing()
// };
// setInterval("checkMove()",50);
// function checkMove() {
//     if (multiScaleFlag == false) return;
//     if (map.getSource("Manhattan")&&map.isSourceLoaded("Manhattan")===true){
//         var divLoadingMessage=document.getElementById("loadingMessage");
//         divLoadingMessage.style.display="none";
//     }
//     //当前地图位置
//     var currPosition={
//         center:map.getCenter(),
//         zoom:map.getZoom(),
//         pitch:map.getPitch(),
//         bearing:map.getBearing()
//     };
//     //判断相机位置是否改变
//     var unchanged = JSON.stringify(currPosition) === JSON.stringify(oldPosition);
//     if (unchanged) return;//地图没改变则返回，改动了继续执行后面的    
//     oldPosition=currPosition;    
//     changeBuildings();
// }

//由于filter in 后面列举的id太多导致速度慢，暂时用moveend
map.on('moveend', function () { 
    if (multiScaleFlag == false) return;
    if (map.getLayer("Manhattan-extrusion")!==undefined) { 
        changeBuildings();
    }
});

//根据id控制建筑的显示隐藏
function showOrHideFeature(id,showOrHide) { 
    if (showOrHide) {
        var index=filteredId.indexOf(id);
        if (index === -1) { 
            filteredId.push(id);
        }        
    } else { 
        var index=filteredId.indexOf(id);
        if (index > -1) {
            filteredId.splice(index, 1);
        }
    }
}

//切换数据 经过计算距离，找到要显示的建筑
function changeBuildings(){
	drawViewPointAndScope();  
    //遍历每个建筑，计算建筑到基准点的距离
    for (var obj in buildingObj){
        //只管三级，减少次数
        if(buildingObj[obj].properties['lv']!=3){continue;}
        var distance=computeDistance(buildingObj[obj]);
        //当前遍历到的三级建筑的id
        var id=buildingObj[obj].properties.OBJECTID;
        //够远，显示三级，不显示子节点一二级
        if (distance>=farDis){
            //显示三级            
            showOrHideFeature(id, true);
            //不显示子节点一二级
            var lod2Str=buildingObj[obj].properties.child;
            var lod2Obj=lod2Str.split('-');
            for(var obj2 in lod2Obj){
                //不显示二级
                var id2=buildingObj[lod2Obj[obj2]].properties.OBJECTID;
                showOrHideFeature(id2, false);
                var lod3Str=buildingObj[lod2Obj[obj2]].properties.child;
                var lod3Obj=lod3Str.split('-');
                for(var obj3 in lod3Obj){
                    //不显示一级
                    var id3=buildingObj[lod3Obj[obj3]].properties.OBJECTID;
                    showOrHideFeature(id3, false);
                }
            }
        }
        //不够远不显示三级，显示二级或一级
        else if(distance<farDis){
            showOrHideFeature(id, false);
            //如果距离符合二级，显示二级，不显示对应一级
            if(distance>=closeDis){
                var lod2Str=buildingObj[obj].properties.child;
                var lod2Obj=lod2Str.split('-');
                for(var obj2 in lod2Obj){
                    //显示二级
                    var id2=buildingObj[lod2Obj[obj2]].properties.OBJECTID;
                    showOrHideFeature(id2, true);
                    var lod3Str=buildingObj[lod2Obj[obj2]].properties.child;
                    var lod3Obj=lod3Str.split('-');
                    for(var obj3 in lod3Obj){
                        //不显示一级
                        var id3=buildingObj[lod3Obj[obj3]].properties.OBJECTID;
                        showOrHideFeature(id3, false);
                    }
                }
            }
            //如果距离太近，不显示二级，显示对应一级
            else {
                var lod2Str=buildingObj[obj].properties.child;
                var lod2Obj=lod2Str.split('-');
                for(var obj2 in lod2Obj){
                    //不显示二级
                    var id2=buildingObj[lod2Obj[obj2]].properties.OBJECTID;
                    showOrHideFeature(id2, false);
                    var lod3Str=buildingObj[lod2Obj[obj2]].properties.child;
                    var lod3Obj=lod3Str.split('-');
                    for(var obj3 in lod3Obj){
                        //显示一级
                        var id3=buildingObj[lod3Obj[obj3]].properties.OBJECTID;
                        showOrHideFeature(id3,true);
                    }
                }
            }
        }
    }
    map.setFilter("Manhattan-extrusion", filteredId);
}

//切换不同的控制细节层次的方法
var frmLodMethod=document.getElementById("lodMethod");
var inputsLodMethod=frmLodMethod.getElementsByTagName("input");
for (var i=0;i<inputsLodMethod.length;i++){
    inputsLodMethod[i].onclick=changeBuildings;
}
function getLodMethod(){
    var lodMethod;
    for (var i=0;i<inputsLodMethod.length;i++){
        if (inputsLodMethod[i].checked==true){
            lodMethod=inputsLodMethod[i].value;
            break;
        }
    }
    return lodMethod;
}

//计算建筑到视点的距离，或到视点中心线的距离，或到当前道路距离 这是确定使用的数据的详细程度的依据
//也可以不计算距离，跟画好的缓冲区做叠置分析
function computeDistance(building){
    var buildingPoint=[building.properties.POINT_X, building.properties.POINT_Y];
    var to = turf.point(buildingPoint);
    var lodMethod=getLodMethod();
    switch (lodMethod){
        case "distance":
            //计算建筑到视点的距离
            var from = turf.point(viewPoint);
            var distance = turf.distance(from, to);
            break;
        case "way":
            //计算建筑到视点中心线的距离。首先找到建筑到中心线最近的点，再计算两点距离
            var buildingPoint=[building.properties.POINT_X, building.properties.POINT_Y];
            var nearestPoint = turf.nearestPointOnLine(viewCenterLine, buildingPoint).geometry.coordinates;
            var from = turf.point(nearestPoint);
            var distance = turf.distance(from, to);
            break;
        case "road":
            //计算建筑到当前道路的距离
            break;
        default:
            break;
    }
    return distance;    
}

//画当前视点，以及划分细节层次的线，即缓冲区的边界线
function drawViewPointAndScope(){
	// 画一个相机的标志，表示视点
    viewPoint=computeViewPoint();
    //首次运行要添加视点这个图层
    if (map.getSource('view-point')===undefined){
    	map.addSource('view-point', {
	        "type": "geojson",
	        "data": {
	            "type": "Point",
	            "coordinates": []
	        }
	    });    
	    map.addLayer({
	        "id": "view-point",
	        "source": "view-point",
	        "type": "symbol",
	        "layout": {
	            "icon-image": "attraction-15",
	            "icon-rotation-alignment": "viewport",
	            "icon-offset":[0,-10]//实际显示的时候往上偏移一点否则看不到
	        }
	    });
    }
    //相机位置改变时更新视点   
    map.getSource('view-point').setData(createGeoJSONPoint(viewPoint));   
	
    //画划分细节层次的线，不同的方法形状不同
    var lodMethod=getLodMethod();
    switch (lodMethod){
        case "distance":
            //根据距离显示不同详细程度 画圆形的缓冲区
            drawAndUpdateScope(turf.point(viewPoint));
            break;
        case "way":
            //沿当前方向详细程度高 先得到视点中心线，再做缓冲区
            var mapSize=map._containerDimensions();
            var screenCenterX=mapSize[0]/2;
            var screenCenterY=mapSize[1]/2;
            var geoCenterObj=map.unproject([screenCenterX,screenCenterY]);
            var geoCenterArr=[geoCenterObj.lng,geoCenterObj.lat];    
            viewCenterLine=turf.lineString([viewPoint,geoCenterArr]);
            drawAndUpdateScope(viewCenterLine);
            break;
        case "road":
            break;
        default:
            break;
    }    
}

//画缓冲区
function drawAndUpdateScope(geometry){
    //经测试发现turf的缓冲区半径有bug，放大1.32倍才准确
    //修复bug，实时计算应该缩放多少倍
    var isFirst=true;
    if (isFirst){
        var buffered=turf.buffer(turf.point(viewPoint), farDis); 
        var points=[viewPoint,buffered.geometry.coordinates[0][0]];//有些库做出来的缓冲区是椭圆的，turf没问题，不用每个点都测
        var linestring=turf.lineString(points);
        var realRadius=turf.lineDistance(linestring);
        var multiplier=farDis/realRadius;//缩放倍数
        isFirst=false;
    }    

    // //首次运行画两个范围线
    if (map.getSource("farBuffer")===undefined){
        drawBuffer("farBuffer",geometry,farDis*multiplier,"red");
    	drawBuffer("closeBuffer",geometry,closeDis*multiplier,"blue");
    }

	//更新范围线，中心的位置随着视点的变化而移动    
    var farBuffered = turf.buffer(geometry, farDis*multiplier);
    var closeBuffered=turf.buffer(geometry, closeDis*multiplier);
    map.getSource('farBuffer').setData(farBuffered);
    map.getSource('closeBuffer').setData(closeBuffered);
}

function drawBuffer(id,center,radius,color){
    var buffered=turf.buffer(center, radius);
    map.addSource(id, {
		"type":"geojson",
		"data":buffered
	});
    map.addLayer({
        "id": id,
        "type": "line",
        "source": id,
        "paint": {
            "line-color": color,
            "line-opacity": 1,
            "line-width": 1
        }
    });
}

//计算视点的坐标
function computeViewPoint(){
	//把屏幕下方(稍微偏上)中点转化为地理坐标
	var mapSize=map._containerDimensions();
    var screenX=mapSize[0]/2;
    var screenY=mapSize[1];
    var objCoordinates=map.unproject([screenX,screenY]);
    var arrCoordinates=[objCoordinates.lng,objCoordinates.lat];
    return arrCoordinates;
}

// Because features come from tiled vector data, feature geometries may be split
// or duplicated across tile boundaries and, as a result, features may appear
// multiple times in query results.
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

function createGeoJSONPoint(center) {
    return {
        "type": "Point",
        "coordinates": center
    };
}