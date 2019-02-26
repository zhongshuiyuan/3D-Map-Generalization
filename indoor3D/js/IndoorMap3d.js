/**
 * Created by gaimeng on 15/3/9.
 */

IndoorMap3d = function(mapdiv){
    var _this = this;
    var _theme = null;
    var _mapDiv = mapdiv,
        _canvasWidth = _mapDiv.clientWidth,
        _canvasWidthHalf = _canvasWidth / 2,
        _canvasHeight = _mapDiv.clientHeight,
        _canvasHeightHalf = _canvasHeight / 2;

    var _scene, _controls, _projector, _rayCaster;
    var  _canvasDiv;
    var _selected;
    var _showNames = true, _showPubPoints = true;
    var _curFloorId = 0;
    var _selectionListener = null;
    var _sceneOrtho, _cameraOrtho;//for 2d
    var _spriteMaterials = [], _pubPointSprites=null, _nameSprites = null;

    this.camera = null;
    this.renderer = null;
    this.mall = null;
    this.is3d = true;

    this.init = function(){

        // perspective scene for normal 3d rendering
        _scene = new THREE.Scene();
        _this.camera = new THREE.PerspectiveCamera(20, _canvasWidth / _canvasHeight, 0.1, 2000);

        //orthogonal scene for sprites 2d rendering
        _sceneOrtho = new THREE.Scene();
        _cameraOrtho = new THREE.OrthographicCamera(- _canvasWidthHalf, _canvasWidthHalf, _canvasHeightHalf, -_canvasHeightHalf, 1, 10);
        _cameraOrtho.position.z = 10;

        //controls
        _controls = new THREE.OrbitControls(_this.camera);

        //renderer
        _this.renderer = new THREE.WebGLRenderer({ antialias: true });
        _this.renderer.autoClear = false;

        //set up the lights
        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(-500, 500, -500);
        _scene.add(light);

        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(500, 500, 500);
        _scene.add(light);

        //canvas div
        _this.renderer.setSize(_mapDiv.clientWidth, _mapDiv.clientHeight);
        _canvasDiv = _this.renderer.domElement
        _mapDiv.appendChild(_canvasDiv);

        _mapDiv.style.overflow = "hidden";
        _canvasDiv.style.width = "100%";
        _canvasDiv.style.height = "100%";
    }

    this.setTheme = function(theme){
        if(_theme == null){
            _theme = theme
        } else if(_theme != theme) {
            _theme = theme;
            _this.parse(_this.mall.jsonData); //parse
        }
        return _this;
    }

    this.theme = function(){
        return _theme;
    }

    //add by xy 方便在这个类的外部对场景做些控制
    this.getScene = function () { 
        return _scene;
    }

    //load the map by the json file name
    this.load = function (fileName, format, callback) {//edit by xy add parameter format indoor3d,geojson,fengmap三种格式
        var loader = new IndoorMapLoader(true);
        _theme = default3dTheme;
        loader.load(fileName, format, function(mall){//edit by xy add parameter format
            _this.mall = mall;
            _scene.add(_this.mall.root);
            _scene.mall = mall;
            if(callback) {
                callback();
            }
            _this.renderer.setClearColor(_theme.background);
            if(_curFloorId == 0){
                _this.showAllFloors();
                _this.adjustCamera();//add by xy只在一开始修改相机位置，切换楼层的时候不修改
            }else{
                _this.showFloor(_curFloorId);
                _this.adjustCamera();//add by xy
            }

        });
        return _this;
    }

    //parse the json file
    this.parse = function(json){
        if(_theme == null) {
            _theme = default3dTheme;
        }
        _this.mall = ParseModel(json, _this.is3d, _theme);
        _scene.mall = _this.mall;
        _this.showFloor(_this.mall.getDefaultFloorId());
        _this.renderer.setClearColor(_theme.background);
        _scene.add(_this.mall.root);
        _mapDiv.style.background = _theme.background;
        return _this;
    }

    //reset the camera to default configuration
    this.setDefaultView = function () {
        //edit by xy 不使用作者用的最佳视角，而是使角度与室外地图保持一致 有些要自己改数据
        //var camAngle = _this.mall.FrontAngle + Math.PI/2;
        var camAngle = _this.mall.FrontAngle;
        var camDir = [Math.cos(camAngle), Math.sin(camAngle)];
        var camLen = 500;
        var tiltAngle = 75.0 * Math.PI/180.0;
        _this.camera.position.set(camDir[1]*camLen, Math.sin(tiltAngle) * camLen, camDir[0]*camLen);//TODO: adjust the position automatically
        _this.camera.lookAt(_scene.position);

        _controls.reset();
        _controls.viewChanged = true;
        return _this;
    }

    //set top view
    this.setTopView = function(){
        _this.camera.position.set(0, 500, 0);
        return _this;
    }

    //TODO:adjust camera to fit the building
    this.adjustCamera = function() {
        _this.setDefaultView();

    }

    this.zoomIn = function(zoomScale){
        _controls.zoomOut(zoomScale);
        redraw();
    }

    this.zoomOut = function(zoomScale){
        _controls.zoomIn(zoomScale);
        redraw();
    }

    //show floor by id
    this.showFloor = function(floorid) {
        _curFloorId = floorid;
        if(_scene.mall == null){
            return;
        }
        _scene.mall.showFloor(floorid);
        //_this.adjustCamera();//comment by xy 切换楼层保持视角缩放等级
        if(_showPubPoints) {
            createPubPointSprites();
        }
        if(_showNames) {
            createNameSprites();
        }
        createPoiSprites();//add by xy POI符号始终添加
        redraw();
        return _this;
    }

    //show all floors
    this.showAllFloors = function(){
        _curFloorId = 0; //0 for showing all
        if(_this.mall == null){
            return;
        }
        _this.mall.showAllFloors();
        //_this.adjustCamera();//comment by xy
        redraw();//add by xy 调整相机里包含了重绘
        // clearPubPointSprites();//edit by xy显示所有楼层时也可以显示注记和符号，原作者是不显示
        // clearNameSprites();
        if(_showPubPoints) {
            createPubPointSprites();
        }
        if (_showNames) { 
            createNameSprites();
        }        
        createPoiSprites();//add by xy POI符号始终添加
        return _this;
    }

    //set if the objects are selectable
    this.setSelectable = function (selectable) {
        if(selectable){
            _projector = new THREE.Projector();
            _rayCaster = new THREE.Raycaster();
            _mapDiv.addEventListener('mousedown', onSelectObject, false);
            _mapDiv.addEventListener('touchstart', onSelectObject, false);
        }else{
            _mapDiv.removeEventListener('mousedown', onSelectObject, false);
            _mapDiv.removeEventListener('touchstart', onSelectObject, false);
        }
        return _this;
    }

    //set if the user can pan the camera
    this.setMovable = function(movable){
        _controls.enable = movable;
        return _this;
    }

    //show the labels
    this.showAreaNames = function(show) {
        _showNames = show == undefined ? true : show;
        return _this;
    }

    //show pubPoints(entries, ATM, escalator...)
    this.showPubPoints = function(show){
        _showPubPoints = show == undefined ? true: show;
        return _this;
    }

    //get the selected object
    this.getSelectedId = function(){
        return _selected.id;
    }

    //the callback function when sth is selected
    this.setSelectionListener = function(callback){
        _selectionListener = callback;
        return _this;
    }

    //select object by id
    this.selectById = function(id){
        var floor = _this.mall.getCurFloor();
        for(var i = 0; i < floor.children.length; i++){
            if(floor.children[i].id && floor.children[i].id == id) {
                if (_selected) {
                    _selected.material.color.setHex(_selected.currentHex);
                }
                select(floor.children[i]);
            }
        }
    }

    //select object(just hight light it)
    function select(obj){
        obj.currentHex = _selected.material.color.getHex();
        obj.material.color = new THREE.Color(_theme.selected);
        obj.scale = new THREE.Vector3(2,2,2);
    }

    function onSelectObject(event) {

        // find intersections
        event.preventDefault();
        var mouse = new THREE.Vector2();
        if(event.type == "touchstart"){
            mouse.x = ( event.touches[0].clientX / _canvasDiv.clientWidth ) * 2 - 1;
            mouse.y = -( event.touches[0].clientY / _canvasDiv.clientHeight ) * 2 + 1;
        }else {
            mouse.x = ( event.clientX / _canvasDiv.clientWidth ) * 2 - 1;
            mouse.y = -( event.clientY / _canvasDiv.clientHeight ) * 2 + 1;
        }
        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        vector.unproject( _this.camera);

        _rayCaster.set( _this.camera.position, vector.sub( _this.camera.position ).normalize() );

        var intersects = _rayCaster.intersectObjects( _this.mall.root.children[0].children );

        if ( intersects.length > 0 ) {

            if ( _selected != intersects[ 0 ].object ) {

                if ( _selected ) {
                    _selected.material.color.setHex( _selected.currentHex );
                }
                for(var i=0; i<intersects.length; i++) {
                    _selected = intersects[ i ].object;
                    if(_selected.type && _selected.type == "solidroom") {
                        select(_selected);
                        if(_selectionListener) {
                            _selectionListener(_selected.id); //notify the listener
                        }
                        break;
                    }else{
                        _selected = null;
                    }
                    if(_selected == null && _selectionListener != null){
                        _selectionListener(-1);
                    }
                }
            }

        } else {

            if ( _selected ) {
                _selected.material.color.setHex( _selected.currentHex );
            }

            _selected = null;
            if(_selectionListener) {
                _selectionListener(-1); //notify the listener
            }
        }
        redraw();

    }

    //add by xy 在该类的外部也能让renderer render
    this.redraw = function () { 
        redraw();
    }

    function redraw(){
        _controls.viewChanged = true;
    }

    //add by xy 显示三维动态符号 隐藏房间、点和注记 或者反过来
    this.showOrHideRoom = function (flag) {
        //隐藏所有房间和房间的骨架线
        var floors = _this.mall.floors;
        floors.forEach(floor => { 
            floor.traverse(function (object) {
                if (object.type == "solidroom" || object.type == "Line") {
                    object.visible = flag;
                }
                else if (object.type == "3dsymbol" ||object.type=="DashedLine") { 
                    object.visible = !flag;
                }
            });
        })
        //隐藏点和注记
        _this.showAreaNames(flag);
        _this.showPubPoints(flag);
        if (flag == true) {
            var floorid = _this.mall.getCurFloor();
            createPubPointSprites(floorid);
            createNameSprites(floorid);
            redraw();
            updateLabels();
        } else { 
            clearNameSprites();
            clearPubPointSprites();
        }
        redraw();
        //显示三维动态符号
    }

    //add by xy 
    this.getZoom = function () {
        return _controls.getZoom();
        //如果使用相机到原点的距离来衡量zoom，在移动之后不准确，原地准确
        // var zoom = _controls.target.distanceTo(controls.object.position);        
    }

    //add by xy 判断zoom是否跨过分界点，跨的时候改变显示内容
    var queueZoom = [1, 1];
    const threshold = 0.6;
    function checkZoom() { 
        var zoom = _this.getZoom();
        queueZoom.shift();
        queueZoom.push(zoom);
        //console.log(queueZoom);
        if (queueZoom[1] < threshold && queueZoom[0] > threshold) {//缩小 跨过阈值
            _this.showOrHideRoom(false);
        }
        else if (queueZoom[1] > threshold && queueZoom[0] < threshold) {//放大 跨过阈值 
            _this.showOrHideRoom(true);
        }
    }

    function animate () {
        requestAnimationFrame(animate);
        _controls.update();
        if(_controls.viewChanged) {

            _this.renderer.clear();
            _this.renderer.render(_scene, _this.camera);

            if (_showNames || _showPubPoints) {
                updateLabels();
            }
            _this.renderer.clearDepth();
            _this.renderer.render(_sceneOrtho, _cameraOrtho);
            //checkZoom();//add by xy
        }

        _controls.viewChanged = false;
    }

    //load Sprites
    function loadSprites(){
        if(_this.mall != null && _spriteMaterials.length == 0){
            var images = _theme.pubPointImg;
            for(var key in images){
                //edit by xy  new version of three.js
                //var texture = THREE.ImageUtils.loadTexture(images[key], undefined, redraw);
                var loader = new THREE.TextureLoader();
                var texture=loader.load(images[key], redraw);
                var material = new THREE.SpriteMaterial({map:texture});
                _spriteMaterials[key] = material;
            }
        }
        _spriteMaterials.isLoaded = true;
    }

    //labels includes pubPoints and shop names
    function updateLabels() {
        var mall = _this.mall;
        if(mall == null || _controls == null || !_controls.viewChanged){
            return;
        }
        var curFloor = mall.getCurFloor();
        if(curFloor == null){
            return;
        }

        var projectMatrix = null;

        if(_showNames) {
            if(_nameSprites != undefined){
                projectMatrix = new THREE.Matrix4();
                projectMatrix.multiplyMatrices(_this.camera.projectionMatrix, _this.camera.matrixWorldInverse);

                updateSprites(_nameSprites, projectMatrix);
            }

        }

        if(_showPubPoints){
            if(_pubPointSprites != undefined){
                if(!projectMatrix){
                    projectMatrix = new THREE.Matrix4();
                    projectMatrix.multiplyMatrices(_this.camera.projectionMatrix, _this.camera.matrixWorldInverse);
                }
                updateSprites(_pubPointSprites, projectMatrix);
            }
        }
        _controls.viewChanged = false;
    };

    //update sprites
    function updateSprites(spritelist, projectMatrix){
        for(var i = 0 ; i < spritelist.children.length; i++){
            var sprite = spritelist.children[i];
            var vec = new THREE.Vector3(sprite.oriX * 0.1, 0, -sprite.oriY * 0.1);
            //vec.applyProjection(projectMatrix);//edit by xy use new three.js
            //vec.applyMatrix4(projectMatrix);//comment by xy

            //var x = Math.round(vec.x * _canvasWidthHalf);//comment by xy
            //var y = Math.round(vec.y * _canvasHeightHalf);
            sprite.position.set(vec.x, 10, vec.z);//edit by xy

            //check collision with the former sprites 
            //先转化成实际在屏幕中显示的坐标和外接矩形，再检测是否冲突，在mapbox中和在three.js的场景中不一样
            // var visible = true;
            // var visibleMargin = 5;
            // for(var j = 0; j < i; j++){
            //     var img = sprite.material.map.image;
            //     if(!img){ //if img is undefined (the img has not loaded)
            //         visible = false;
            //         break;
            //     }

            //     var imgWidthHalf1 = sprite.width / 2;
            //     var imgHeightHalf1 = sprite.height / 2;
            //     var rect1 = new Rect(sprite.position.x - imgWidthHalf1, sprite.position.y - imgHeightHalf1,
            //             sprite.position.x + imgHeightHalf1, sprite.position.y + imgHeightHalf1 );

            //     var sprite2 = spritelist.children[j];
            //     var sprite2Pos = sprite2.position;
            //     var imgWidthHalf2 = sprite2.width / 2;
            //     var imgHeightHalf2 = sprite2.height / 2;
            //     var rect2 = new Rect(sprite2Pos.x - imgWidthHalf2, sprite2Pos.y - imgHeightHalf2,
            //             sprite2Pos.x + imgHeightHalf2, sprite2Pos.y + imgHeightHalf2 );

            //     if(sprite2.visible && rect1.isCollide(rect2)){
            //         visible = false;
            //         break;
            //     }

            //     rect1.tl[0] -= visibleMargin;
            //     rect1.tl[1] -= visibleMargin;
            //     rect2.tl[0] -= visibleMargin;
            //     rect2.tl[1] -= visibleMargin;


            //     if(sprite.visible == false && rect1.isCollide(rect2)){
            //         visible = false;
            //         break;
            //     }
            // }
            // sprite.visible = visible;
        }
    }

    //为每个楼层的所有funcarea创建名称注记 使用threebox将three.js的场景加到mapbox中sprite会一直正对 
    //todo 大小保持不变要sizeAttenuation 融合r96的three.js到threebox
    function createNameSprites(){
        _this.mall.jsonData.data.Floors.forEach(floor => {
            var floorObj = _this.mall.getFloor(floor._id);
            _nameSprites = new THREE.Object3D();
            var funcAreaJson = floor.FuncAreas;
            for (var i = 0; i < funcAreaJson.length; i++) {
                var sprite = makeTextSprite(funcAreaJson[i].Name, _theme.fontStyle);
                sprite.position.set(funcAreaJson[i].Center[0], funcAreaJson[i].Center[1], floorObj.height);//注记高于房间高度这样不会被遮住
                _nameSprites.add(sprite);
            }
            floorObj.add(_nameSprites);
        });        
    }

    //为每个楼层的所有大多数主要funcarea创建poi符号
    function createPoiSprites() {
        //todo 准备好各种符号，要存放到一个对象里
        var loader = new THREE.TextureLoader();
        var texture=loader.load("./img/food.png");//先测试一下food的符号
        var material = new THREE.SpriteMaterial({map:texture});

        //遍历每个楼层，给各个funcarea找到对应的poi符号并加上去
        _this.mall.jsonData.data.Floors.forEach(floor => {
            var floorObj = _this.mall.getFloor(floor._id);
            var poiSprites = new THREE.Object3D();
            var funcAreaJson = floor.FuncAreas;
            for (var i = 0; i < funcAreaJson.length; i++) {
                if (funcAreaJson[i].Category === "餐饮") {//todo 现在只用餐饮符号试试 
                    var sprite = new THREE.Sprite(material);
                    //todo z坐标动态设置，房间拔起来的高度+sprite本身高度的一半
                    sprite.position.set(funcAreaJson[i].Center[0], funcAreaJson[i].Center[1], 3);
                    sprite.scale.set(2, 2, 2);
                    poiSprites.add(sprite);
                }                
            }
            floorObj.add(poiSprites);
        });     
    }

    //create the pubpoint sprites in a floor by the floor id
    function createPubPointSprites(){
        if(!_spriteMaterials.isLoaded){
            loadSprites();
        }

        if(!_pubPointSprites) {
            _pubPointSprites = new THREE.Object3D();
        }else{
            clearPubPointSprites();
        }

        var pubPointsJson = _this.mall.getFloorJson(_this.mall.getCurFloorId()).PubPoint;
        var imgWidth, imgHeight;
        for(var i = 0; i < pubPointsJson.length; i++){
            var spriteMat = _spriteMaterials[pubPointsJson[i].Type];
            if(spriteMat !== undefined) {
                imgWidth = 8, imgHeight = 8;//edit by xy 改为perspective相机后大小要变 原来是30
                var sprite = new THREE.Sprite(spriteMat);
                sprite.scale.set(imgWidth, imgHeight, 1);
                sprite.oriX = pubPointsJson[i].Outline[0][0][0];
                sprite.oriY = pubPointsJson[i].Outline[0][0][1];
                sprite.width = imgWidth;
                sprite.height = imgHeight;
                _pubPointSprites.add(sprite);
            }
        }
        //_sceneOrtho.add(_pubPointSprites);
        _scene.add(_pubPointSprites);//edit by xy
    }

    function clearNameSprites(){
        if(_nameSprites == null){
            return;
        }
        _nameSprites.remove(_nameSprites.children);
        _nameSprites.children.length = 0;
    }
    function clearPubPointSprites(){
        if(_pubPointSprites == null){
            return;
        }
        _pubPointSprites.remove(_pubPointSprites.children);
        _pubPointSprites.children.length = 0;
    }

    function makeTextSprite( message, parameters )
    {
        if ( parameters === undefined ) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";

        var fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 18;

        var borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 2;

        var borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };

        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

        var fontColor = parameters.hasOwnProperty("color")?
            parameters["color"] : "#000000";

        //var spriteAlignment = parameters.hasOwnProperty("alignment") ?
        //	parameters["alignment"] : THREE.SpriteAlignment.topLeft;

        var spriteAlignment = new THREE.Vector2( 0, 0 );


        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        var metrics = context.measureText( message );
//
//        // background color
//        context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
//            + backgroundColor.b + "," + backgroundColor.a + ")";
//        // border color
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
            + borderColor.b + "," + borderColor.a + ")";
//
//        context.lineWidth = borderThickness;
//        context.strokeRect(borderThickness/2, borderThickness/2, metrics.width + borderThickness, fontsize * 1.4 + borderThickness);

        // text color
        context.fillStyle = fontColor;

        context.fillText( message, borderThickness, fontsize + borderThickness);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas)
        texture.needsUpdate = true;


        var spriteMaterial = new THREE.SpriteMaterial(
            {
                map: texture,
                //useScreenCoordinates: false comment by xy new version of three.js don't have this property
            });
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(20,10,1.0);//edit by xy 改为perspective相机后大小要变，原来是(100,50,1.0)
        sprite.width = metrics.width;
        sprite.height = fontsize * 1.4;
        return sprite;
    }

    //resize the map
    this.resize = function (width, height){
        _this.camera.aspect = width / height;
        _this.camera.updateProjectionMatrix();

        _this.renderer.setSize( width, height );
        _controls.viewChanged = true;
    }

    _this.init();
    animate();

}