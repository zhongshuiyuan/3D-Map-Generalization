//初始化室内地图
var params = {
    dim: "3d"
};
var map = IndoorMap(params);
const scale = 0.1;//IndoorMap.js-->function ParseModel()

var buildings = ['data/testMapData.json', 'data/beijing2.json', 'data/shenzhen.json'];
var buildingID = GetQueryString("buildingID");
var data = buildingID ? buildings[buildingID - 1] : buildings[0];

map.load(data, function () {
    //map.setTheme(testTheme);
    map.showAreaNames(true).showPubPoints(true).setSelectable(true).showFloor(1);
    var ul = IndoorMap.getUI(map);
    document.body.appendChild(ul);

    //添加辅助线
    var scene = map.getScene();
    var axes = new THREE.AxesHelper(100);
    scene.add(axes);

    //addSymbol();
    //addHeatmap();
});

//从url获取当前要显示的是哪栋建筑，从主页面向iframe传递参数
function GetQueryString(name)
{
     var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
     var r = window.location.search.substr(1).match(reg);
     if(r!=null)return  unescape(r[2]); return null;
}

//测试按钮
var popularitySwitch = true;
document.getElementById("popularity").addEventListener("click", function () { 
    var floorObj = map.mall.floors[1];//测试一楼
    floorObj.children.forEach(object => { 
        if (object.type == "dynamicsymbol") { 
            object.visible = popularitySwitch;
        }
    })
    map.redraw();
    popularitySwitch = !popularitySwitch;
})

function addSymbol() {
    var floorObj = map.mall.floors[1];//测试一楼
    var funcAreaJson = map.mall.getFloorJson(1).FuncAreas;
    
    loadSymbol('objModel/daocha.obj', 'objModel/daocha.mtl', 1000,'101');
    //loadSymbol('objModel/gouwuche.obj', 'objModel/gouwuche.mtl', '102');
    loadSymbol('objModel/bao.obj', 'objModel/bao.mtl', 250,'103');    
 
    function loadSymbol(objName, mtlName, scale,category) { 
        loadObj(objName, mtlName, scale,function (object) { 
            funcAreaJson.forEach(room => {
                if (room.Category == category) { 
                    var center = room.Center;
                    var objectClone = object.clone();
                    objectClone.type = "3dsymbol";
                    objectClone.position.x = center[0];
                    objectClone.position.y = center[1];
                    floorObj.add(objectClone);
                    var sphere = new SpherePulse(Math.random()*4, center);
                    floorObj.add(sphere.getSphere());
                    map.redraw();
                }            
            }) 
        })    
    }
}

function loadObj(objName, mtlName, scale, callback) { 
    //加载过程和结果处理
    var onProgress = function(xhr) {
        if (xhr.lengthComputable) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            var percentText = Math.round(percentComplete, 2) + '% 已经加载';
            console.log(percentText);
        }
    };
    var onError = function(xhr) {};   
    //加载、回调
    var loader = new THREE.OBJMTLLoader();              
    loader.load(objName, mtlName, function (object) {
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.transparent = false;
                child.shading = THREE.FlatShading;
                //child.depthWrite = 10;
            }
        });
        object.scale.set(scale, scale, scale);//floorObj本身就缩小了十倍，所以要放大
        object.rotation.x = Math.PI / 2;//如要往floorObj里加模型，要考虑它是后来旋转过的
        object.visible = false;//缩小后才可见
        callback(object);
    }, onProgress, onError);
}

function SpinningWifi(size,center) { 
    var _this = this;
    var plane;
    this.size = size;

    this.getWifi = function () { 
        return plane;
    }

    this.init = function () { 
        // create the ground plane
        var planeGeometry = new THREE.PlaneGeometry(size, size);
        var texture = THREE.ImageUtils.loadTexture("./img/wifi.png");
        planeMaterial = new THREE.MeshBasicMaterial({ map: texture,transparent:true,side:THREE.DoubleSide });
        plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.x = center[0];
        plane.position.z = -center[1];
        plane.position.y = size / 2;

        animate();
    }

    var animate = function () {
        requestAnimationFrame( animate );
        plane.rotation.y += 0.01;
        map.redraw();
    };
    
    _this.init();
}

function SpherePulse(radius, center) { 
    var _this = this;
    var scale = 0.1;//IndoorMap.js function ParseModel
    var sphere, mater;//sphereMaterial,sphereMaterialTemp;
    this.radius = radius;
    this.center = center;

    this.getSphere = function () { 
        return sphere;
    }

    this.init = function () { 
        //设置球体的值
        var radius = _this.radius, center = _this.center;
        var segemnt = 32, rings = 16;

        mater = getGlow();
        sphere = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segemnt, rings),
            mater
        );
        sphere.position.x = center[0];
        sphere.position.y = center[1];
        sphere.type = "dynamicsymbol";
        sphere.visible = false;
        sphere.geometry.verticesNeedUpdate = true;
        sphere.geometry.normalsNeedUpdate = true;
        sphereAnimate();
    }

    function sphereAnimate(){
        requestAnimationFrame( sphereAnimate );
        sphererender();
    }
    var start = Date.now();//用于持续动画
    function sphererender(){
        // TWEEN.update();
        if(Date.now()-start>1){
            if(sphere.scale.x<100)
            {
                sphere.material = mater;
                sphere.scale.x++;
                sphere.scale.y++;
                sphere.scale.z++;
            }
            
            if(sphere.scale.x>=100){
                sphere.material = new THREE.MeshLambertMaterial( {color: 0x7777ff, transparent:true, opacity:0.05} );
                setTimeout(function(){
                    sphere.scale.x=1;
                    sphere.scale.y=1;
                    sphere.scale.z=1;
                },100);
            }
        }
        map.redraw();
        start=Date.now();
    }

    _this.init();
}

function addHeatmap() {
    //地板
    var floorMesh = map.mall.floors[1].children[0];//只选了一层楼添加
    //给地板贴纹理
    assignUVs(floorMesh.geometry);
    var texture = THREE.ImageUtils.loadTexture("./img/wifiheatmap.png");
    floorMesh.material = new THREE.MeshBasicMaterial({ map: texture,opacity:1 });
    floorMesh.material.needsUpdate = true;
    //旋转的wifi符号
    var wifi1 = new SpinningWifi(16, [14, 31]);
    map.getScene().add(wifi1.getWifi());
    var wifi2 = new SpinningWifi(16, [4, -13]);
    map.getScene().add(wifi2.getWifi());
    var wifi3 = new SpinningWifi(16, [0, -50]);
    map.getScene().add(wifi3.getWifi());
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

//列举数据里每种类型的店各有哪些
function listCategory() { 
    // var categories = {};
    // for (var i = 1; i <= 6; i++) { 
    //     var funcAreaJson = map.mall.getFloorJson(i).FuncAreas;
    //     //console.log(funcAreaJson);        
    //     funcAreaJson.forEach(room => { 
    //         if (categories[room.Category] == undefined) {
    //             categories[room.Category] = [];
    //             categories[room.Category].push(room.Name);
    //         } else { 
    //             categories[room.Category].push(room.Name);
    //         }
    //     })
    // }    
    // console.log(categories);
}