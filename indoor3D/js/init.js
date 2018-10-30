//初始化室内地图
var params = {
    dim: "3d"
};
var map = IndoorMap(params);

var buildings = ['data/testMapData.json', 'data/beijing2.json', 'data/shenzhen.json'];
var buildingID = GetQueryString("buildingID");
var data = buildingID ? buildings[buildingID - 1] : buildings[0];

map.load(data, function () {
    //map.setTheme(testTheme);
    map.showAreaNames(true).setSelectable(true).showFloor(1);
    var ul = IndoorMap.getUI(map);
    document.body.appendChild(ul);

    //添加辅助线
    var scene = map.getScene();
    var axes = new THREE.AxisHelper(100);
    scene.add(axes);

    //addSymbol();
});

//从url获取当前要显示的是哪栋建筑，从主页面向iframe传递参数
function GetQueryString(name)
{
     var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
     var r = window.location.search.substr(1).match(reg);
     if(r!=null)return  unescape(r[2]); return null;
}

document.getElementById("test").addEventListener("click", function () { 
    
})

function addSymbol() {
    var scene = map.getScene();
    //加载模型
    var onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;			            
            progresstext = Math.round(percentComplete, 2) + '% 已经加载';
            console.log(progresstext);
        }
    };
    var onError = function(xhr) {};
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('objModel/');
    mtlLoader.load('food.mtl', function(materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('objModel/');
        objLoader.load('food.obj', function(object) {
            object.position.y = 10;
            object.rotation.x = 180;
            object.rotation.z = 45;
            object.scale.set(50, 50, 50);
            scene.add(object);	
        }, onProgress, onError);
    });

    var floorObj = map.mall.floors[1];//测试一楼
    var funcAreaJson = map.mall.getFloorJson(1).FuncAreas;
    // funcAreaJson[0].Center[0];
    // funcAreaJson[0].Center[1];

}

function addHeatmap() { 
    //给地板贴纹理表示wifi信号分布
    if (buildingID == 1) {//只选了一栋楼 
        var floorMesh = map.mall.floors[1].children[0];//只选了一层楼添加
        assignUVs(floorMesh.geometry);
        var texture = THREE.ImageUtils.loadTexture("./img/heatmap.png");
        floorMesh.material = new THREE.MeshBasicMaterial({ map: texture });
        floorMesh.material.needsUpdate = true;
    }
}

function assignUVs(geometry) {

    geometry.computeBoundingBox();

    var max = geometry.boundingBox.max,
            min = geometry.boundingBox.min;
    var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
    var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
    var faces = geometry.faces;

    geometry.faceVertexUvs[0] = [];

    for (var i = 0; i < faces.length; i++) {

        var v1 = geometry.vertices[faces[i].a],
                v2 = geometry.vertices[faces[i].b],
                v3 = geometry.vertices[faces[i].c];

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
            new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
            new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
        ]);
    }
    geometry.uvsNeedUpdate = true;
}