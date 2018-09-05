///********************控制噪音、光照、云雾等环境信息***********************/
var noiseToggle = document.getElementById("noiseLayer");
noiseToggle.onclick = function () { 
    if (map.getSource("noise_32levels") === undefined) { 
        addNoise('noise_32levels', './data/road32.png', 16, 18);
        addNoise('noise_16levels', './data/road16.png', 14, 16);
        addNoise('noise_8levels', './data/road8.png', 12.5, 14);
        addNoise('noise_4levels', './data/road4.png', 11, 12.5);
    }
    var visibility = this.checked ? 'visible' : 'none';
    map.setLayoutProperty('noise_32levels', 'visibility', visibility);
    map.setLayoutProperty('noise_16levels','visibility',visibility);
    map.setLayoutProperty('noise_8levels', 'visibility', visibility);
    map.setLayoutProperty('noise_4levels','visibility',visibility);
};

function addNoise(id,url,minzoom,maxzoom) { 
    map.addSource(id, {
        type: 'image',
        url: url,//使用arcgis核密度做好的
        coordinates: [
            [121.2981, 31.2414],
            [121.4660, 31.2414],
            [121.4660, 31.1232],
            [121.2981, 31.1232]
        ]
    });
    map.addLayer({
        id: id,
        source: id,
        type: 'raster',
        minzoom: minzoom,
        maxzoom: maxzoom,
        paint: {
            'raster-opacity': 0.7
        }
    }, labelLayerId);
}

// //动态符号
// document.getElementById("dynamic_symbol").addEventListener("click", toggleDynamicSymbol);
// const soundWaveFrameCount = 6;
// var soundWaveInterval;
// function toggleDynamicSymbol() {    
//     if (this.checked == true) {
//         dynamicSymbol();
//     } else {
//         clearInterval(soundWaveInterval);
//         for (var i = 0; i < soundWaveFrameCount; i++) { 
//             map.setPaintProperty('shengbo' + i, 'raster-opacity', 0);
//         }
//     }
// }
// function dynamicSymbol() {    
//     for (var i = 0; i < soundWaveFrameCount; i++) {
//         if (map.getSource("shengbo" + i) === undefined) { 
//             map.addSource("shengbo" + i, {
//                 type: 'image',
//                 url: 'shengbo/shengbo' + i + '.png',
//                 coordinates: [
//                     [121.4148, 31.1637],
//                     [121.4349, 31.1637],
//                     [121.4349, 31.1472],
//                     [121.4148, 31.1472]
//                 ]
//             });        
//             map.addLayer({
//                 id: 'shengbo' + i,
//                 source: 'shengbo' + i,
//                 type: 'raster',
//                 paint: {
//                     'raster-opacity': 0,
//                     'raster-opacity-transition': {
//                         duration: 0
//                     }
//                 }
//             });
//         }        
//     }

//     var frame = soundWaveFrameCount - 1;
//     soundWaveInterval=setInterval(function() {
//         map.setPaintProperty('shengbo' + frame, 'raster-opacity', 0);
//         frame = (frame + 1) % soundWaveFrameCount;
//         map.setPaintProperty('shengbo' + frame, 'raster-opacity', 1);
//     }, 200);
// }

// //添加源和图层并控制图层的显示隐藏
// function controlLayerVisibility(elementId, sourceId, sourceObj, layerId, layerObj, before) { 
//     var toggle=document.getElementById(elementId);
//     toggle.onclick=function(){
//         if (map.getSource(sourceId)===undefined){
//             map.addSource(sourceId, sourceObj);
//         }
//         if (map.getLayer(layerId)===undefined){
//             map.addLayer(layerObj,before);
//         }
//         if (this.checked===true){
//             map.setLayoutProperty(layerId,'visibility','visible');
//         }else{
//             map.setLayoutProperty(layerId,'visibility','none');
//         }
//     };
// }

// //每段路有个噪音值的道路
// controlLayerVisibility("noise_road", "noise_road", {
//     "type": "geojson",
//     "data": "noise_road.geojson"
// }, "noise_road", {
//     "id": "noise_road",
//     "type": "line",
//     "source": "noise_road",
//     "layout": {
//         "line-join": "round",
//         "line-cap": "round"
//     },
//     "paint": {
//         "line-color": [
//             "interpolate",
//             ["linear"],
//             ["get", "decibel"],
//             0, "rgb(255,255,0)",
//             99, "rgb(255,0,0)"
//         ],
//         "line-width": 5
//     }
//     }, labelLayerId);

// //产生噪音的点
// controlLayerVisibility("noise_point", "noise_point", {
//     "type": "geojson",
//     "data": "noisePoints.geojson"
// }, "noise_point", {
//     "id": "noise_point",
//     "type": "circle",
//     "source": "noise_point",
//     "minzoom": 12,
//     "paint": {
//         // Size circle radius by decibal and zoom level
//         "circle-radius": [
//             "interpolate",
//             ["linear"],
//             ["zoom"],
//             12, [
//                 "interpolate",
//                 ["linear"],
//                 ["get", "decibel"],
//                 1, 1,
//                 100, 4
//             ],
//             16, [
//                 "interpolate",
//                 ["linear"],
//                 ["get", "decibel"],
//                 1, 1,
//                 100, 8
//             ]
//         ],
//         // Color circle by decibel
//         "circle-color": [
//             "interpolate",
//             ["linear"],
//             ["get", "decibel"],
//             1, "rgba(33,102,172,0)",
//             20, "rgb(103,169,207)",
//             40, "rgb(209,229,240)",
//             60, "rgb(253,219,199)",
//             80, "rgb(239,138,98)",
//             100, "rgb(178,24,43)"
//         ],
//         "circle-stroke-color": "white",
//         "circle-stroke-width": 1
//     }
// }, labelLayerId);

// //点构成的噪音热力图
// controlLayerVisibility("point_noise", "noise_point", {
//     "type": "geojson",
//     "data": "noisePoints.geojson"//这里跟点图层共用一个source
// }, "point_noise", {
//     "id": "point_noise",
//     "type": "heatmap",
//     "source": "noise_point",
//     "maxzoom": 20,
//     "paint": {
//         // Increase the heatmap weight based on decibel
//         "heatmap-weight": [
//             "interpolate",
//             ["linear"],
//             ["get", "decibel"],
//             0, 1,
//             100, 5
//         ],
//         // Increase the heatmap color weight weight by zoom level
//         // heatmap-intensity is a multiplier on top of heatmap-weight
//         "heatmap-intensity": [
//             "interpolate",
//             ["linear"],
//             ["zoom"],
//             0, 1,
//             20, 1
//         ],
//         // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
//         // Begin color ramp at 0-stop with a 0-transparancy color
//         // to create a blur-like effect.
//         "heatmap-color": [
//             "interpolate",
//             ["linear"],
//             ["heatmap-density"],
//             0, "rgba(0, 255, 0, 0)",
//             0.1, "rgb(0,255,0)",
//             0.3, "rgb(125,255,0)",
//             0.5, "rgb(255,255,0)",
//             0.7, "rgb(255,128,0)",
//             1, "rgb(255,0,0)"
//         ],
//         // Adjust the heatmap radius by zoom level
//         "heatmap-radius": [
//             "interpolate",
//             ["linear"],
//             ["zoom"],
//             0, 2,
//             20, 25
//         ],
//     }
// }, labelLayerId);

//*********光照**********// TODO globe控件有点不跟手
//光照相关控件加进来并绑定事件
var canvEl = document.getElementById('canv');
var widgetWidth = menu.offsetWidth-20;//本来源代码是canv.offsetWidth，由于一开始面板要隐藏，改为使用menu的宽度
var g = Globe()
    .color('rgba(255,255,255,0.8)')
    .lightColor('#86cfd2')
    .width(widgetWidth)
    .on('change', function(rotation) {
        map.setLight({
            position: rotation,
            'position-transition': {
                duration: 0
            }
        });
    });
d3.select('#canv')
    .append('div')
    .call(ColorPicker()
        .width(widgetWidth)
        .height(Math.min(widgetWidth, 150))
        .center('#86cfd2')
        .on('change', function(color) {
            g.lightColor(color);
            map.setLight({
                color: color,
                'color-transition': {
                    duration: 0
                }
            });
        }));
d3.select('#globe')
    .append('div')
    .call(g);
document.getElementById('intensity').addEventListener('input', function(e) {
    map.setLight({
        intensity: +e.target.value,
        'intensity-transition': {
            duration: 0
        }
    });
}); 

//***********云*************//
var cloudMesh;
var cloudPosition = [121.444534,31.171876,300];
var normalDistribution=[],randomDistribution=[];//固定的正态分布随机数和完全随机数
for (var i=0;i<1000;i++){
    normalDistribution[i]=getNumberInNormalDistribution(0,1);
    randomDistribution[i]=Math.random();
}

document.getElementById("cloudToggle").addEventListener("change",function(){
    if (this.checked){
        if (cloudMesh){
            cloudMesh.visible=true;
            return;
        }

        // Initialize threebox
        window.threebox = new Threebox(map);
        threebox.setupDefaultLights();

        updateCloud();

        function animate() {
            requestAnimationFrame( animate );
            cloudPosition[0]+=0.00001;
            cloudPosition[1]+=0.00001;
            threebox.moveToCoordinate(cloudMesh, cloudPosition, {scaleToLatitude: true, preScale: 2});
        }
        animate();
    }else{
        cloudMesh.visible=false;
    }
});

document.getElementById("cloudPara").addEventListener('change', updateCloud);

function updateCloud() { 
    var inputs = document.getElementById("cloudPara").getElementsByTagName('input');
    var para = {};
    for (var i = 0; i < inputs.length; i++) { 
        var input = inputs[i];
        if (input.name === 'color') { 
            var r = parseInt(input.value).toString(16);
            if (r.length === 1) r = 0 + r;
            var rgb = "0x" + r + r + r;
            para[input.name] = Number(rgb);
            continue;
        }
        para[input.name] = input.value;
    }
    console.log(para);
    threebox.world.remove(threebox.world.children[1]);
    addCloud(para);
}

function addCloud(objPara){
    var geometry = new THREE.Geometry();

    var texture = THREE.ImageUtils.loadTexture( './data/cloud10.png');
    texture.magFilter = THREE.LinearMipMapLinearFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    var fog = new THREE.Fog( objPara.color, - 100, 3000 );

    var material = new THREE.ShaderMaterial( {
        uniforms: {
            "map": { type: "t", value: texture },
            "fogColor" : { type: "c", value: fog.color },
            "fogNear" : { type: "f", value: fog.near },
            "fogFar" : { type: "f", value: fog.far },
        },
        vertexShader: document.getElementById( 'vs' ).textContent,
        fragmentShader: document.getElementById( 'fs' ).textContent,
        depthWrite: false,
        depthTest: false,
        transparent: true
    } );

    var plane = new THREE.Mesh( new THREE.PlaneGeometry( 64, 64 ) );
    for ( var i = 0; i < 10; i++ ) {
        plane.position.x = normalDistribution[i] * 200;
        plane.position.y = normalDistribution[2*i] * 200;
        plane.position.z = normalDistribution[3*i] * 200;
        plane.rotation.z = randomDistribution[i] * Math.PI;
        plane.scale.x = plane.scale.y = randomDistribution[2*i] * objPara.size;

        THREE.GeometryUtils.merge( geometry, plane );
    }

    cloudMesh = new THREE.Mesh( geometry, material );
    threebox.addAtCoordinate(cloudMesh, cloudPosition, {scaleToLatitude: true, preScale: 2});
}

function getNumberInNormalDistribution(mean,std_dev){
    return mean+(randomNormalDistribution()*std_dev);
}

function randomNormalDistribution(){
    var u=0.0, v=0.0, w=0.0, c=0.0;
    do{
        //获得两个（-1,1）的独立随机变量
        u=Math.random()*2-1.0;
        v=Math.random()*2-1.0;
        w=u*u+v*v;
    }while(w==0.0||w>=1.0)
    //这里就是 Box-Muller转换
    c=Math.sqrt((-2*Math.log(w))/w);
    //返回2个标准正态分布的随机数，封装进一个数组返回
    //当然，因为这个函数运行较快，也可以扔掉一个
    //return [u*c,v*c];
    return u*c;
}