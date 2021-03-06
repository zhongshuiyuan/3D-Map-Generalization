/**
 * Created by gaimeng on 14/12/27.
 */

var System={};
var js=document.scripts;
js=js[js.length-1].src.substring(0,js[js.length-1].src.lastIndexOf("/"));
System.path = js;
System.libPath = System.path.substring(0,System.path.lastIndexOf("/"));
System.imgPath = System.libPath+"/img";

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik M ller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] +
            'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() {
            callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
    if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    };
}());

//IDM namespace
var IDM = {}
IDM.Browser = {};
//Browser detection
(function() {
    var a = "ActiveXObject" in window,
        c = a && !document.addEventListener,
        e = navigator.userAgent.toLowerCase(),
        f = -1 !== e.indexOf("webkit"),
        m = -1 !== e.indexOf("chrome"),
        p = -1 !== e.indexOf("phantom"),
        isAndroid = -1 !== e.indexOf("android"),
        r = -1 !== e.search("android [23]"),
        gecko = -1 !== e.indexOf("gecko"),
        isIphone = -1 !== e.indexOf("iphone"),
        isSymbianOS = -1 !== e.indexOf("symbianos"),
        isWinPhone = -1 !== e.indexOf("windows phone"),
        isIpad =  -1 !== e.indexOf("ipad"),
        k = isIphone || isWinPhone || isSymbianOS || isAndroid ||isIpad,
        q = window.navigator && window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints && !window.PointerEvent,
        t = window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints || q,
        y = "devicePixelRatio" in window && 1 < window.devicePixelRatio || "matchMedia" in window && window.matchMedia("(min-resolution:144dppi)") &&
            window.matchMedia("(min-resolution:144dppi)").matches,
        l = document.documentElement,
        A = a && "transition" in l.style,
        x = "WebKitCSSMatrix" in window && "m11" in new window.WebKitCSSMatrix && !r,
        B = "MozPerspective" in l.style,
        z = "OTransition" in l.style,
        G = !window.L_DISABLE_3D && (A || x || B || z) && !p,
        p = !window.L_NO_TOUCH && !p && function() {
                if (t || "ontouchstart" in l) return !0;
                var a = document.createElement("div"),
                    c = !1;
                if (!a.setAttribute) return !1;
                a.setAttribute("ontouchstart", "return;");
                "function" === typeof a.ontouchstart && (c = !0);
                a.removeAttribute("ontouchstart");
                return c
            }();
    IDM.Browser = {
        ie: a,
        ielt9: c,
        webkit: f,
        gecko: gecko && !f && !window.opera && !a,
        android: isAndroid,
        android23: r,
        iphone: isIphone,
        ipad: isIpad,
        symbian: isSymbianOS,
        winphone: isWinPhone,
        chrome: m,
        ie3d: A,
        webkit3d: x,
        gecko3d: B,
        opera3d: z,
        any3d: G,
        mobile: k,
        mobileWebkit: k && f,
        mobileWebkit3d: k && x,
        mobileOpera: k && window.opera,
        touch: p,
        msPointer: q,
        pointer: t,
        retina: y
    }
}());

//---------------------the IDM.GeomUtil class--------------------
//get the bounding Rect of the points
function Rect(minx,miny,maxx,maxy){
    this.tl = [minx || 0, miny || 0]; //top left point
    this.br = [maxx || 0, maxy || 0]; //bottom right point
}

Rect.prototype.isCollide = function(rect){
    if(rect.br[0] < this.tl[0] || rect.tl[0] > this.br[0] ||
        rect.br[1] < this.tl[1] || rect.tl[1] > this.br[1]){
        return false;
    }
    return true;
}

IDM.GeomUtil = {

    getBoundingRect: function (points) {
        var rect = new Rect();
        //if there are less than 1 point
        if (points.length < 2) {
            return rect;
        }
        var minX = 9999999, minY = 9999999, maxX = -9999999, maxY = -9999999;
        for (var i = 0; i < points.length - 1; i += 2) {

            if (points[i] > maxX) {
                maxX = points[i];
            }
            if (points[i] < minX) {
                minX = points[i];
            }
            if (points[i + 1] > maxY) {
                maxY = points[i + 1];
            }
            if (points[i + 1] < minY) {
                minY = points[i + 1];
            }
        }
        rect.tl = [minX, minY];
        rect.br = [maxX, maxY];
        return rect;
    }
}
//---------------------the IDM.DomUtil class--------------------
IDM.DomUtil = {

    getElementLeft: function (element) {
        var actualLeft = element.offsetLeft;
        var current = element.offsetParent;
        while (current !== null) {
            actualLeft += current.offsetLeft;
            current = current.offsetParent;
        }
        return actualLeft;
    },

    getElementTop: function (element) {

        var actualTop = element.offsetTop;
        var current = element.offsetParent;
        while (current !== null) {
            actualTop += current.offsetTop;
            current = current.offsetParent;
        }
        return actualTop;
    },

    getTranslateString: function(point) {
        var dim = IDM.Browser.webkit3d;
        return "translate" + (dim ? "3d" : "") + "(" + point[0] + "px," + point[1] + "px" + ((dim ? ",0" : "") + ")");
    },

    getPos: function (element) {
        return element._idm_pos ? element._idm_pos : [IDM.DomUtil.getElementLeft(element), IDM.DomUtil.getElementTop(element)];
    },
    setPos: function (element, point) {
        element._idm_pos = point;
        IDM.Browser.any3d ? element.style[IDM.DomUtil.TRANSFORM] = IDM.DomUtil.getTranslateString(point) : (element.style.left = point[0] + "px", element.style.top = point[1] + "px")
        //element.style.left = point[0] + "px";
        //element.style.top = point[1] + "px";
    },

    testProp: function(props) {
        for (var c =
            document.documentElement.style, i = 0; i < props.length; i++)
            if (props[i] in c) return props[i];
        return false;
    }
}

IDM.DomUtil.TRANSFORM = IDM.DomUtil.testProp(["transform", "WebkitTransform", "OTransform", "MozTransform", "msTransform"]);
IDM.DomUtil.TRANSITION = IDM.DomUtil.testProp(["webkitTransition", "transition", "OTransition", "MozTransition", "msTransition"]);
IDM.DomUtil.TRANSITION_END = "webkitTransition" === IDM.DomUtil.TRANSITION || "OTransition" === IDM.DomUtil.TRANSITION ? IDM.DomUtil.TRANSITION + "End" : "transitionend";

//---------------------the Mall class--------------------
function Mall(){
    var _this = this;
    this.floors = [];   //the floors
    this.building = null; //the building
    this.root = null; //the root scene
    this.is3d = true;
    this.jsonData = null; //original json data

    var _curFloorId;

    //get building id
    this.getBuildingId = function(){
        var mallid = _this.jsonData.data.building.Mall;
        return mallid? mallid : -1;
    }

    //get default floor id
    this.getDefaultFloorId = function(){
        return _this.jsonData.data.building.DefaultFloor;
    }
    //get current floor id
    this.getCurFloorId = function() {
        return _curFloorId;
    }

    //get floor num
    this.getFloorNum = function(){
        return _this.jsonData.data.Floors.length;
    }

    //get floor by id
    this.getFloor = function(id) {
        for(var i = 0; i < _this.floors.length; i++) {
            if(_this.floors[i]._id == id) {
                return _this.floors[i];
            }
        }
        return null;
    }

    //get floor by name
    this.getFloorByName = function(name){
        for(var i = 0; i < _this.floors.length; i++) {
            if(_this.floors[i].Name == name) {
                return _this.floors[i];
            }
        }
        return null;
    }

    //get current floor
    this.getCurFloor = function() {
        return _this.getFloor(_curFloorId);
    }

    //get Floor's json data
    this.getFloorJson = function(fid){
        var floorsJson = _this.jsonData.data.Floors;
        for(var i = 0; i < floorsJson.length; i++){
            if(floorsJson[i]._id == fid) {
                return floorsJson[i];
            }
        }
        return null;
    }

    //show floor by id
    this.showFloor = function(id){
        if(_this.is3d) {
            //set the building outline to invisible
            _this.root.remove(_this.building);
            //set all the floors to invisible
            for (var i = 0; i < _this.floors.length; i++) {
                if (_this.floors[i]._id == id) {
                    //set the specific floor to visible
                    _this.floors[i].position.set(0, 0, 0);
                    _this.root.add(_this.floors[i]);
                } else {
                    _this.root.remove(_this.floors[i]);
                }
            }
        }
        _curFloorId = id;
    }

    //show the whole building
    this.showAllFloors = function(){
        if(!_this.is3d){ //only the 3d map can show all the floors
            return;
        }

        //_this.root.add(_this.building); edit by xy 不要建筑轮廓

        var offset = 10; //edit by xy 可拉大间距 原本是4
        for(var i=0; i<_this.floors.length; i++){
            _this.floors[i].position.set(0,0,i*_this.floors[i].height*offset);
//            if(i == 4){
//                _this.floors[i].position.set(0,-300,i*_this.floors[i].height*offset);
//            }else{
//
//            }
            _this.root.add(this.floors[i]);
        }
        this.building.scale.set(1,1,offset);

        _curFloorId = 0;

        return _this.root;
    }
}

//----------------------------theme--------------------------------------

var default2dTheme = {
    name: "test", //theme's name
    background: "#F2F2F2", //background color

    //building's style
    building: {
        color: "#000000",
        opacity: 0.1,
        transparent: true,
        depthTest: false
    },

    //floor's style
    floor: {
        color: "#E0E0E0",
        opacity: 1,
        transparent: false
    },

    //selected room's style
    selected: "#ffff55",

    //rooms' style
    room: function (type, category) {
        var roomStyle;
        if(!category) {
            switch (type) {

                case 100: //hollow. u needn't change this color. because i will make a hole on the model in the final version.
                    return {
                        color: "#F2F2F2",
                        opacity: 0.8,
                        transparent: true
                    }
                case 300: //closed area
                    return {
                        color: "#AAAAAA",
                        opacity: 0.7,
                        transparent: true
                    };
                case 400: //empty shop
                    return {
                        color: "#D3D3D3",
                        opacity: 0.7,
                        transparent: true
                    };
                default :
                    break;
            }
        }

        switch(category) {
            case 101: //food
                roomStyle = {
                    color: "#1f77b4",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 102: //retail
                roomStyle = {
                    color: "#aec7e8",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 103: //toiletry
                roomStyle = {
                    color: "#ffbb78",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 104: //parent-child
                roomStyle = {
                    color: "#98df8a",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 105: //life services
                roomStyle = {
                    color: "#bcbd22",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 106: //education
                return {
                    color: "#2ca02c",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 107: //life style
                roomStyle = {
                    color: "#dbdb8d",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 108: //entertainment
                roomStyle = {
                    color: "#EE8A31",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 109: //others
                roomStyle = {
                    color: "#8c564b",
                    opacity: 0.7,
                    transparent: true
                };
            default :
                roomStyle = {
                    color: "#c49c94",
                    opacity: 0.7,
                    transparent: true
                };
                break;
        }
        return roomStyle;
    },

    //room wires' style
    strokeStyle: {
        color: "#666666",
        opacity: 0.5,
        transparent: true,
        linewidth: 1
    },

    fontStyle:{
        opacity: 1,
        textAlign: "center",
        textBaseline: "middle",
        color: "#333333",
        fontsize: 13,
        fontface: "'Lantinghei SC', 'Microsoft YaHei', 'Hiragino Sans GB', 'Helvetica Neue', Helvetica, STHeiTi, Arial, sans-serif  "
    },

    pubPointImg: {

        "11001": System.imgPath+"/toilet.png",
        "11002": System.imgPath+"/ATM.png",
        "21001": System.imgPath+"/stair.png",
        "22006": System.imgPath+"/entry.png",
        "21002": System.imgPath+"/escalator.png",
        "21003": System.imgPath+"/lift.png"
    }
}
var default3dTheme = {
    name: "test", //theme's name
    background: "#F2F2F2", //background color

    //building's style
    building: {
        color: "#000000",
        opacity: 0.1,
        transparent: true,
        depthTest: false
    },

    //floor's style
    floor: {
        color: "#E0E0E0",
        opacity: 1,
        transparent: false
    },

    //add by xy 奇数层和偶数层颜色不一样，好区分
    floorOdd: {
        color: "#E0E0E0",
        opacity: 1,
        transparent: false
    },

    floorEven: {
        color: "#C0C0C0",
        opacity: 1,
        transparent: false
    },

    //selected room's style
    selected: "#ffff55",

    //rooms' style
    room: function (type, category) {
        var roomStyle;
        if(!category) {
            switch (type) {

                case 100: //hollow. u needn't change this color. because i will make a hole on the model in the final version.
                    return {
                        color: "#F2F2F2",
                        opacity: 0.8,
                        transparent: true
                    }
                case 300: //closed area
                    return {
                        color: "#AAAAAA",
                        opacity: 0.7,
                        transparent: true
                    };
                case 400: //empty shop
                    return {
                        color: "#D3D3D3",
                        opacity: 0.7,
                        transparent: true
                    };
                default :
                    break;
            }
        }

        switch(category) {
            case 101: //food
                roomStyle = {
                    color: "#1f77b4",
                    opacity: 0.7,//comment by xy 为了让wifi热力图更清楚可调低透明度
                    transparent: true
                };
                break;
            case 102: //retail
                roomStyle = {
                    color: "#aec7e8",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 103: //toiletry
                roomStyle = {
                    color: "#ffbb78",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 104: //parent-child
                roomStyle = {
                    color: "#98df8a",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 105: //life services
                roomStyle = {
                    color: "#bcbd22",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 106: //education
                return {
                    color: "#2ca02c",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 107: //life style
                roomStyle = {
                    color: "#dbdb8d",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 108: //entertainment
                roomStyle = {
                    color: "#EE8A31",
                    opacity: 0.7,
                    transparent: true
                };
                break;
            case 109: //others
                roomStyle = {
                    color: "#8c564b",
                    opacity: 0.7,
                    transparent: true
                };
            default :
                roomStyle = {
                    color: "#c49c94",
                    opacity: 0.7,
                    transparent: true
                };
                break;
        }
        return roomStyle;
    },

    //room wires' style
    strokeStyle: {
        color: "#5C4433",
        opacity: 0.5,
        transparent: true,
        linewidth: 2
    },

    fontStyle:{
        color: "#231815",
        fontsize: 40,
        fontface: "Helvetica, MicrosoftYaHei "
    },

    pubPointImg: {

        "11001": System.imgPath+"/toilet.png",
        "11002": System.imgPath+"/ATM.png",
        "21001": System.imgPath+"/stair.png",
        "22006": System.imgPath+"/entry.png",
        "21002": System.imgPath+"/escalator.png",
        "21003": System.imgPath+"/lift.png"
    }
}

//add by xy 由于光照的影响 效果不太好
var custom3dTheme = {
    name: "test", //theme's name
    background: "#F2F2F2", //background color

    //building's style
    building: {
        color: "#000000",
        opacity: 0.1,
        transparent: true,
        depthTest: false
    },

    //floor's style
    floor: {
        color: "#E0E0E0",
        opacity: 1,
        transparent: false
    },

    //add by xy 奇数层和偶数层颜色不一样，好区分
    floorOdd: {
        color: "#E0E0E0",
        opacity: 1,
        transparent: false
    },

    floorEven: {
        color: "#C0C0C0",
        opacity: 1,
        transparent: false
    },

    //selected room's style
    selected: "#ffff55",

    //rooms' style
    room: function (type, category) {
        var roomStyle;
        if(!category) {
            switch (type) {

                case 100: //hollow. u needn't change this color. because i will make a hole on the model in the final version.
                    return {
                        color: "#F2F2F2",
                        opacity: 0.8,
                        transparent: true
                    }
                case 300: //closed area
                    return {
                        color: "#AAAAAA",
                        opacity: 0.7,
                        transparent: true
                    };
                case 400: //empty shop
                    return {
                        color: "#D3D3D3",
                        opacity: 0.7,
                        transparent: true
                    };
                default :
                    break;
            }
        }

        switch(category) {
            case "餐饮":
                roomStyle = {
                    color: "#FF6633",//"#FFB41E",//0"#1f77b4",//"#F3E5C7",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "美容美发":
                roomStyle = {
                    color: "#E9967A",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "购物": 
                roomStyle = {
                    color: "#87CEEB",//"#FA8072",//0"#aec7e8",//"#DED4E1",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "电影院":
                roomStyle = {
                    color: "#BC8f8f",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "电梯":
                roomStyle = {
                color: "#696969",
                opacity: 0.8,
                transparent: true
            };
                break;
            case "公司企业":
                roomStyle = {
                    color: "#DEB887",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "孵化器":
                roomStyle = {
                    color: "#FFA07A",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "楼梯":
                roomStyle = {
                    color: "#808080",//"#87CEFA",//0"#C6DCE1",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "未开放区域":
            roomStyle = {
                color: "#FFEBCD",//"#FFB41E",//0"#1f77b4",//"#F3E5C7",
                opacity: 0.8,
                transparent: true
            };
            break;
            case "线下体验":
                roomStyle = {
                    color: "#FFc0cb",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "摄影店":
                roomStyle = {
                    color: "#7FFFD4",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "照相馆":
                roomStyle = {
                    color: "#7FFFD4",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "生活服务":
                roomStyle = {
                    color: "#FF69B4",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "空铺":
                roomStyle = {
                    color: "#FF6600",//"#FFB41E",//0"#1f77b4",//"#F3E5C7",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "中空":
                roomStyle = {
                    color: "#F0E68C",//"#c49c94",//"#DFDFDF",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "孵化器":
                roomStyle = {
                    color: "#FF6600",//"#FFB41E",//0"#1f77b4",//"#F3E5C7",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "客服":
                roomStyle = {
                    color: "#00FFFF",//"#00FA9A",//"#dbdb8d",//"#E9DCD8",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "休息区":
                roomStyle = {
                    color: "#AFEEEE",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "培训机构":
                roomStyle = {
                    color: "#D2B48C",//"#BA55D3"
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "教育机构":
                roomStyle = {
                    color: "#FFA07A",//"#D2B48C",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "网咖":
                roomStyle = {
                    color: "#DA70D6",//"#BA55D3"
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "医疗":
                roomStyle = {
                    color: "#F08080",//"#EE8A31",//"#EDBEB5",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "医药":
                roomStyle = {
                    color: "#CD5C5C",//"#EE8A31",//"#EDBEB5",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "母婴店":
                roomStyle = {
                    color: "#ff99cc",//"#BA55D3"
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "台球厅":
                roomStyle = {
                    color: "#CC66CC",//"#EE8A31",//"#EDBEB5",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            case "儿童活动区":
                roomStyle = {
                    color: "#FFb6c1",
                    opacity: 0.8,
                    transparent: true
                };
                break;
            default:
                roomStyle = {
                    color: "#CCFFFF",//"#98df8a"0,
                    opacity: 0.8,
                    transparent: true
                };
        }
        return roomStyle;
    },

    //room wires' style
    strokeStyle: {
        color: "#5C4433",
        opacity: 0.5,
        transparent: true,
        linewidth: 2
    },

    fontStyle:{
        color: "#231815",
        fontsize: 40,
        fontface: "Helvetica, MicrosoftYaHei "
    },

    pubPointImg: {

        "11001": System.imgPath+"/toilet.png",
        "11002": System.imgPath+"/ATM.png",
        "21001": System.imgPath+"/stair.png",
        "22006": System.imgPath+"/entry.png",
        "21002": System.imgPath+"/escalator.png",
        "21003": System.imgPath+"/lift.png"
    }
}

//----------------------------the Loader class --------------------------
IndoorMapLoader= function ( is3d ) {
    THREE.Loader.call( this, is3d );

    this.withCredentials = false;
    this.is3d = is3d;
};

IndoorMapLoader.prototype = Object.create( THREE.Loader.prototype );

IndoorMapLoader.prototype.load = function ( url, format, callback, texturePath ) {//edit by xy add parameter format

    var scope = this;

    this.url = url;//add by xy 后面还要读取该文件所在路径下的其他文件
    this.format = format;//add by xy
    this.onLoadStart();
    this.loadAjaxJSON( this, url, callback );

};

IndoorMapLoader.prototype.loadAjaxJSON = function ( context, url, callback, callbackProgress ) {

    var xhr = new XMLHttpRequest();

    var length = 0;

    xhr.onreadystatechange = function () {

        if ( xhr.readyState === xhr.DONE ) {

            if ( xhr.status === 200 || xhr.status === 0 ) {

                if ( xhr.responseText ) {

                    var json = JSON.parse( xhr.responseText );

                    var result = context.parse( json );
                    callback( result );

                } else {

                    console.error( 'IndoorMapLoader: "' + url + '" seems to be unreachable or the file is empty.' );

                }

                // in context of more complex asset initialization
                // do not block on single failed file
                // maybe should go even one more level up

                context.onLoadComplete();

            } else {

                console.error( 'IndoorMapLoader: Couldn\'t load "' + url + '" (' + xhr.status + ')' );

            }

        } else if ( xhr.readyState === xhr.LOADING ) {

            if ( callbackProgress ) {

                if ( length === 0 ) {

                    length = xhr.getResponseHeader( 'Content-Length' );

                }

                callbackProgress( { total: length, loaded: xhr.responseText.length } );

            }

        } else if ( xhr.readyState === xhr.HEADERS_RECEIVED ) {

            if ( callbackProgress !== undefined ) {

                length = xhr.getResponseHeader( 'Content-Length' );

            }

        }

    };

    xhr.open( 'GET', url, true );
    xhr.withCredentials = this.withCredentials;
    xhr.send( null );

};

IndoorMapLoader.prototype.parse = function (json) {
    //return ParseModel(json, this.is3d); edit by xy 原来只有这行后面都是自己加的
    switch (this.format) { 
        case 'indoor3d':
            return ParseModel(json, this.is3d);
            break;
        case 'geojson':
            var standardJson = parseGeojson(json, this.url);
            return ParseModel(standardJson, this.is3d, custom3dTheme);
            break;
        case 'fengmap':
            break;
        default:
            return ParseModel(json, this.is3d);
            break;
    }
    

};

//-----------------------------the Parser class ---------------------------------------
//add by xy 解析数据 geojson 蜂鸟 indoor3d 三种来源的数据都转成统一标准的对象字面量
//数据模板 基于indoor3d原始的数据格式做减法
// var standardJson = {};
// var data = {
//     building: {
//         Outline: [],
//     },
//     Floors: []
// };
// var floor = {
//     Outline: [],
//     _id: null,
//     Name:null,
//     PubPoint: [],
//     FuncAreas: []        
// };
// var point = {
//     Type: null,
//     Outline: []
// };
// var area = {
//     Name: null,
//     Category: null,
//     Outline: [],
//     Center: []
// };

//解析indoor3d项目的格式的数据 (供实验用，为解析其他格式做准备，实际不会使用)
function parseIndoor3dData(json) { 
    //数据模板 基于indoor3d原始的数据格式做减法
    var standardJson = {};
    var data = {
        building: {
            Outline: [],
        },
        Floors: []
    };
    standardJson.data = data;
    //解析indoor3d的数据 照搬
    data.building.Outline = json.data.building.Outline;
    json.data.Floors.forEach(itemFloor => { 
        var newFloor = {};
        newFloor.Outline = itemFloor.Outline;
        newFloor._id = itemFloor._id;
        newFloor.Name = itemFloor.Name;
        newFloor.PubPoint = [];
        newFloor.FuncAreas = [];
        itemFloor.PubPoint.forEach(itemPubPoint => {
            var newPubPoint = {};
            newPubPoint.Type = itemPubPoint.Type;
            newPubPoint.Outline = itemPubPoint.Outline;
            newFloor.PubPoint.push(newPubPoint);
        });
        itemFloor.FuncAreas.forEach(itemFuncArea => {
            var newFuncArea = {};
            newFuncArea.Name = itemFuncArea.Name;
            newFuncArea.Category = itemFuncArea.Category;
            newFuncArea.Outline = itemFuncArea.Outline;
            newFuncArea.Center=itemFuncArea.Center;
            newFloor.FuncAreas.push(newFuncArea);
        });
        data.Floors.push(newFloor);
    })
    // console.log(standardJson,json);
    return standardJson;
}

//解析蜂鸟地图格式的数据
function parseFengmap(json) { 
    //数据模板 基于indoor3d原始的数据格式做减法
    var standardJson = {};
    var data = {
        building: {
            Outline: [],
        },
        Floors: []
    };
    standardJson.data = data;
    
    //后面都是用实际的web墨卡托的坐标减去中心的坐标
    var centerX = json.building.DefaultCenX;
    var centerY = json.building.DefaultCenY;
    
    //获取建筑边界
    var borderJSON;
    $.ajaxSettings.async = false;
    $.getJSON(directory + json.building.Outline, function (buildingBorderJSON) {
        borderJSON = buildingBorderJSON;
    });
    var borderPoints = borderJSON.features[0].geometry.coordinates[0];
    var buildingOutline = [];
    borderPoints.forEach(borderPoint => {
        buildingOutline.push(borderPoint[0] - centerX);
        buildingOutline.push(borderPoint[1] - centerY);
    });
    data.building.Outline.push([buildingOutline]);

    //遍历各个楼层
    json.Floors.forEach(floorInfo => {
        //楼层对象
        var newFloor = {
            Outline: data.building.Outline,//TODO 暂时没给每个楼层单独画轮廓
            _id: floorInfo._id,
            Name: floorInfo.Name,
            PubPoint: [],
            FuncAreas: []
        };
        //打开单个楼层的geojson
        var floorGeoJSON;
        $.ajaxSettings.async = false;
        $.getJSON(directory + floorInfo.filename, function (floorGeoJson) {
            floorGeoJSON = floorGeoJson;
        });
        //遍历每个房间
        floorGeoJSON.features.forEach(feature => {
            //房间对象
            var newFuncArea = {
                Name: feature.properties.Name,
                Category: feature.properties.Category,
                Outline: [],
                Center: [feature.properties.CenterX, feature.properties.CenterY]
            };
            //房间轮廓
            var points = feature.geometry.coordinates[0];
            var areaOutline = [];
            points.forEach(point => {
                areaOutline.push(point[0] - centerX);
                areaOutline.push(point[1] - centerY);
            });
            newFuncArea.Outline.push([areaOutline]);

            newFloor.FuncAreas.push(newFuncArea);
        });

        data.Floors.push(newFloor);
    });
    return standardJson;    
}

//解析geojson格式的数据 自己用arcgis画各个楼层 导出geojson 用json文件组织各楼层
function parseGeojson(json,url) {
    //数据模板 基于indoor3d原始的数据格式做减法
    var standardJson = {};
    var data = {
        building: {
            Outline: [],
        },
        Floors: []
    };
    standardJson.data = data;

    //获取当前读取的json文件所在的路径
    var slash = url.lastIndexOf("/");
    var directory = url.substr(0, slash+1);//不能漏了斜杠本身
    
    //后面都是用实际的web墨卡托的坐标减去中心的坐标
    var centerX = json.building.Center[0];
    var centerY = json.building.Center[1];

    //遍历各个楼层
    json.Floors.forEach(floorInfo => {
        //楼层对象
        var newFloor = {
            Outline: [],
            _id: floorInfo._id,
            Name: floorInfo.Name,
            PubPoint: [],
            FuncAreas: []
        };
        //打开单个楼层的geojson
        var floorGeoJSON;
        $.ajaxSettings.async = false;
        $.getJSON(directory + floorInfo.filename, function (floorGeoJson) {
            floorGeoJSON = floorGeoJson;
        });
        //遍历每个要素
        floorGeoJSON.features.forEach(feature => {
            //添加原始房间数据
            if (feature.properties.level !== "boundary") {
                //房间对象
                var newFuncArea = {
                    Name: feature.properties.Name,
                    Category: feature.properties.Category,
                    Outline: [],
                    Center: [feature.properties.CenterX - centerX, feature.properties.CenterY - centerY],
                    level: feature.properties.level//只有geojson格式才有
                };
                //房间轮廓 注意带洞的多边形
                var polygons = feature.geometry.coordinates;
                polygons.forEach(polygon => { 
                    var areaOutline = [];
                    polygon.forEach(point => {
                        areaOutline.push(point[0] - centerX);
                        areaOutline.push(point[1] - centerY);
                    });
                    newFuncArea.Outline.push([areaOutline]);
                })

                newFloor.FuncAreas.push(newFuncArea);
            }
            //添加楼层的轮廓
            else if (feature.properties.level === "boundary") { 
                var boundaryPoints = feature.geometry.coordinates[0];
                var floorOutline = [];
                boundaryPoints.forEach(boundaryPoint => {
                    floorOutline.push(boundaryPoint[0] - centerX);
                    floorOutline.push(boundaryPoint[1] - centerY);
                });
                newFloor.Outline.push([floorOutline]);
            }
        });

        data.Floors.push(newFloor);
    });

    //用一楼的边界作为建筑的边界
    data.Floors.forEach(floor => {
        if (floor._id == "1") {
            data.building.Outline = floor.Outline;
        }
    });

    return standardJson;    
}

function ParseModel(json, is3d, theme){

    var mall = new Mall();

    function parse() {

        mall.jsonData = json;
        mall.is3d = is3d;

        if(theme == undefined) {
            if (is3d) {
                theme = default3dTheme;
            } else {
                theme = default2dTheme;
            }
        }

        var building,shape, extrudeSettings, geometry, material, mesh, wire, points;
        var scale = 0.1, floorHeight, buildingHeight = 0;

        //floor geometry
        for(var i=0; i<json.data.Floors.length; i++){
            var floor = json.data.Floors[i];
            floor.rect = IDM.GeomUtil.getBoundingRect(floor.Outline[0][0]);

            if(is3d) { // for 3d model
                var floorObj = new THREE.Object3D();
                floorHeight = floor.High / scale;
                //floorHeight = floor.High / scale * 2;//edit by xy 增加楼层之间的间距
                if (floorHeight == 0.0||isNaN(floorHeight)) { //if it's 0, set to 50.0 //edit by xy add NaN
                    floorHeight = 2.0;//change by xy from 50 to 2
                }
                buildingHeight += floorHeight;
                points = parsePoints(floor.Outline[0][0]);
                shape = new THREE.Shape(points);
                geometry = new THREE.ShapeGeometry(shape);
                //comment by xy 这里可以修改地板颜色使得奇数层偶数层颜色不同，好区分
                mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(theme.floor));
                // var floorTheme = (i % 2 != 0) ? theme.floorOdd : theme.floorEven;
                // mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(floorTheme));
                mesh.position.set(0, 0, 0);//change by xy from 0 0 -5 to 0 0 0

                floorObj.height = floorHeight;
                floorObj.add(mesh);
                floorObj.points = [];
                floorObj._id = floor._id;

                //add by xy 每层楼自己的围墙 效果不太好
                // extrudeSettings = { depth: floorHeight*10, bevelEnabled: false };//与mall的类里offset遥相呼应
                // geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                // mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(theme.building));
                // floorObj.add(mesh);

                mall.floors.push(floorObj);
            }else{//for 2d model
                floor.strokeStyle = theme.strokeStyle.color;
                floor.fillColor = theme.floor.color;
                mall.floors.push(floor);
            }

            //funcArea geometry
            for(var j=0; j<floor.FuncAreas.length; j++){

                var funcArea = floor.FuncAreas[j];
                funcArea.rect = IDM.GeomUtil.getBoundingRect(funcArea.Outline[0][0]);

                if(is3d) {
                    points = parsePoints(funcArea.Outline[0][0]);
                    shape = new THREE.Shape(points);
                    //add by xy注意带洞多边形
                    if (funcArea.Outline.length > 1) {
                        var count = 0;
                        funcArea.Outline.forEach(polygon => { 
                            count++;
                            if (count == 1) return;                            
                            var holePoints = parsePoints(polygon[0]);
                            shape.holes.push(new THREE.Shape(holePoints));
                        })
                    }

                    var center = funcArea.Center;
                    //add by xy 加了个Category:funcArea.Category可以删掉 测试用
                    floorObj.points.push({ name: funcArea.Name, type: funcArea.Type, Category:funcArea.Category, position: new THREE.Vector3(center[0] * scale, floorHeight * scale, -center[1] * scale)});

                    //solid model
                    //edit by xy 把房间变矮 new version of three.js amount-->depth
                    extrudeSettings = {depth: floorHeight, bevelEnabled: false};
                    //extrudeSettings = {depth: floorHeight/3, bevelEnabled: false};
                    geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    material = new THREE.MeshLambertMaterial(theme.room(parseInt(funcArea.Type), funcArea.Category));
                    mesh = new THREE.Mesh(geometry, material);
                    mesh.type = "solidroom";
                    mesh.id = funcArea._id;
                    if (funcArea.level) { //add by xy 不同zoom显示不同层次的数据
                        mesh.level = funcArea.level;
                        if (mesh.level != 1) { 
                            mesh.visible = false;
                        }
                    }                    
                    
                    floorObj.add(mesh);

                    //top wireframe
                    // geometry = shape.createPointsGeometry();//edit by xy new version of three.js
                    geometry = new THREE.BufferGeometry().setFromPoints(points);
                    wire = new THREE.Line(geometry, new THREE.LineBasicMaterial(theme.strokeStyle));
                    //edit by xy 房间变矮
                    wire.position.set(0, 0, floorHeight);
                    //wire.position.set(0, 0, floorHeight/3);                    
                    //floorObj.add(wire); comment by xy 加到mapbox之后有锯齿

                    //bottom wireframe add by xy 在缩小只显示符号的时候画出虚线的轮廓线
                    //.computeLineDistances() has been removed. Use THREE.Line.computeLineDistances() instead.
                    //geometry.computeLineDistances();//必须，否则无虚线
                    // var dashedMaterial = new THREE.LineDashedMaterial( {
                    //     color: 0xffffff,
                    //     linewidth: 1,
                    //     scale: 1,
                    //     dashSize: 20,
                    //     gapSize: 10,
                    // });
                    // var dashedWire = new THREE.Line(geometry, dashedMaterial);
                    // dashedWire.visible = false;
                    // dashedWire.type = "DashedLine";
                    // floorObj.add(dashedWire);
                }else{
                    funcArea.fillColor = theme.room(parseInt(funcArea.Type), funcArea.Category).color;
                    funcArea.strokeColor = theme.strokeStyle.color;

                }
            }

            if(is3d) {
                //pubPoint geometry
                for (var j = 0; j < floor.PubPoint.length; j++) {
                    var pubPoint = floor.PubPoint[j];
                    var point = parsePoints(pubPoint.Outline[0][0])[0];
                    floorObj.points.push({name: pubPoint.Name, type: pubPoint.Type, position: new THREE.Vector3(point.x * scale, floorHeight * scale, -point.y * scale)});
                }
            }
        }

        if(is3d) {
            mall.root = new THREE.Object3D(); //if is 3d, create a root object3D

            //building geometry
            building = json.data.building;
            points = parsePoints(building.Outline[0][0]);
            // mall.FrontAngle = building.FrontAngle;
            mall.FrontAngle = 0;//edit by xy 不要这项，全都正北方向

            if (points.length > 0) {
                shape = new THREE.Shape(points);
                extrudeSettings = {depth: buildingHeight, bevelEnabled: false};//edit by xy amount-->depth new version of three.js
                geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial(theme.building));

                mall.building = mesh;
            }

            //scale the mall
            mall.root.scale.set(scale, scale, scale);
            mall.root.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
        }

        return mall;
    };

    //parse the points to THREE.Vector2 (remove duplicated points)
    function parsePoints(pointArray){
        var shapePoints = [];
        for(var i=0; i < pointArray.length; i+=2){
            var point = new THREE.Vector2(pointArray[i], pointArray[i+1]);
            if(i>0) {
                var lastpoint = shapePoints[shapePoints.length - 1];
                if (point.x != lastpoint.x || point.y != lastpoint.y) { //there are some duplicate points in the original data
                    shapePoints.push(point);
                }
            }else{
                shapePoints.push(point);
            }
        }
        return shapePoints;
    }

    return parse();
}
//-----------------------------the IndoorMap class ------------------------------------

var IndoorMap = function (params) {
    var _this = this;
    var _mapDiv, _uiRoot, _uiSelected;
    var _fullScreen = false;
    this.is3d = true;
    var _indoorMap;

    //initialization
    function init(params) {

        //parse the parameters
        if(params != undefined){
            //if the map container is specified
            if (params.hasOwnProperty("mapDiv")) {
                _mapDiv = document.getElementById(params.mapDiv);
                _fullScreen = false;
            }
            //if the map size is specified
            else if(params.hasOwnProperty("size") && params.size.length == 2){
                createMapDiv(params.size);
                _fullScreen = false;
            }
            //else create a full screen map
            else{
                createMapDiv([window.innerWidth,window.innerHeight]);
                _fullScreen = true;
            }
            // 2d or 3d view
            if(params.hasOwnProperty("dim")){
                _this.is3d = params.dim == "2d" ? false : true;
            }else{
                _this.is3d = true;
            }
        }else{
            createMapDiv([window.innerWidth,window.innerHeight]);
            _fullScreen = true;
        }

        // create 2d or 3d map by webgl detection
        if (_this.is3d && Detector.webgl) {
            _indoorMap = new IndoorMap3d(_mapDiv);
        } else {
            _indoorMap = new IndoorMap2d(_mapDiv);
            _this.is3d = false;
        }

        //var marker = document.createElement("image");
        //marker.style.position = "absolute";
        //marker.style.src = System.imgPath+"/marker.png";
        //marker.visibility = false;
        //marker.style.width = "39px";
        //marker.style.height = "54px";
        //document.body.appendChild(marker);
        ////_indoorMap.setSelectionMarker(marker);

    }

    function createMapDiv(size){
        _mapDiv = document.createElement("div");
        _mapDiv.style.width = size[0] + "px";
        _mapDiv.style.height = size[1] + "px";
        _mapDiv.style.top = "0px";
        _mapDiv.style.left = "0px";
        _mapDiv.style.position = "absolute";
        _mapDiv.id = "indoor3d";
        document.body.appendChild(_mapDiv);
        document.body.style.margin = "0";
    }


    function updateUI() {
        if(_uiRoot == null){
            return;
        }
        var ulChildren = _uiRoot.children;
        if(ulChildren.length == 0){
            return;
        }
        if(_uiSelected != null){
            _uiSelected.className = "";
        }
        var curid = _this.mall.getCurFloorId();
        if( curid == 0){
            _uiSelected = _uiRoot.children[0];
        }else{
            for(var i = 0; i < ulChildren.length; i++){
                if(ulChildren[i].innerText == _this.mall.getCurFloorId().toString() ){
                    _uiSelected = ulChildren[i];
                }
            }
        }
        if(_uiSelected != null){
            _uiSelected.className = "selected";
        }
    }

    init(params);
    return _indoorMap;
}

//get the UI
IndoorMap.getUI = function(indoorMap){
    var _indoorMap = indoorMap;
    if(_indoorMap == undefined || _indoorMap.mall == null){
        console.error("the data has not been loaded yet. please call this function in callback")
        return null;
    }
    //create the ul list
    _uiRoot = document.createElement('ul');
    _uiRoot.className = 'floorsUI';

    if(_indoorMap.is3d) {
        var li = document.createElement('li');
        var text = document.createTextNode('All');

        li.appendChild(text);
        _uiRoot.appendChild(li);
        li.onclick = function () {
            _indoorMap.showAllFloors();
        }
    }

    var floors = _indoorMap.mall.jsonData.data.Floors;
    for(var i = 0; i < floors.length; i++){
        (function(arg){
            li = document.createElement('li');
            text = document.createTextNode(floors[arg].Name);
            li.appendChild(text);
            li.onclick = function () {
                _indoorMap.showFloor(floors[arg]._id);
            }
            _uiRoot.appendChild(li);
        })(i);
    }
    return _uiRoot;
}

//add by xy 两种控制楼层的模式 显示全部楼层时，点楼层按钮就是抽出对应楼层；显示单独楼层时，点楼层按钮是切换楼层；两种模式可以切换
IndoorMap.getUL = function(indoorMap){
    var _indoorMap = indoorMap;
    if(_indoorMap == undefined || _indoorMap.mall == null){
        console.error("the data has not been loaded yet. please call this function in callback")
        return null;
    }
    //create the ul list
    _uiRoot = document.createElement('ul');
    _uiRoot.className = 'floorsUI';
    _uiRoot.mode = _indoorMap.mall.getCurFloorId()===0?"All":"One";//根据当前显示状态选择模式

    if(_indoorMap.is3d) {
        var li = document.createElement('li');
        //根据当前模式选择按钮是单个图层还是多个图层
        li.style.backgroundImage = _uiRoot.mode==="All"?"url('img/all_floors_min.png')":"url('img/one_floor_min.png')";
        li.style.backgroundRepeat = "no-repeat";
        li.style.backgroundPosition = "center";
        _uiRoot.appendChild(li);
        //切换模式
        li.onclick = function () {
            if (_uiRoot.mode === 'All') {
                _indoorMap.showFloor(1);                
                _uiRoot.mode = 'One';
                this.style.backgroundImage = "url('img/one_floor_min.png')";
            } else { 
                _indoorMap.showAllFloors();
                _uiRoot.mode = 'All';
                this.style.backgroundImage = "url('img/all_floors_min.png')";
            }
        }
    }

    var floors = _indoorMap.mall.jsonData.data.Floors;
    var rect = IDM.GeomUtil.getBoundingRect(_indoorMap.mall.jsonData.data.building.Outline[0][0]);
    const offset = 2 / 3 * (rect.br[1] - rect.tl[1]);//抽出来抽多远
    const interval = 30;//_indoorMap.mall.floors[1].position.z;//原本的楼层间隔
    for (var i = floors.length - 1; i >= 0;i--){
        (function(arg){
            li = document.createElement('li');
            text = document.createTextNode(floors[arg].Name);
            li.appendChild(text);
            li.atNormalPosition = true;//存储楼层是否没被抽出来在原来的位置上
            li.onclick = function () {
                if (_uiRoot.mode === 'One') {//切换楼层
                    _indoorMap.showFloor(floors[arg]._id);
                    //updateUI();
                }
                // else {//抽
                //     //if (arg === 0) return;//arg=0抽出来可能会撞到别的建筑
                //     //this.className = this.atNormalPosition ? "selected" : "";
                //     var object3d=indoorMap.mall.getFloor(floors[arg]._id);
                //     const y=object3d.position.y;
                //     var coords={y:y};
                //     const end={y:this.atNormalPosition?y-offset:y+offset};//抽出来or推回去
                //     var tween=new TWEEN.Tween(coords) 
                //         .to(end,1000)
                //         .easing(TWEEN.Easing.Quadratic.Out)
                //         .onUpdate(function(){//注意：有个requestAnimationFrame中在update Tween
                //             object3d.position.y=coords.y;
                //         })
                //         .start();
                //     this.atNormalPosition = !this.atNormalPosition;
                // }
                else {//加大间隔 
                    var coords = {};
                    var end = {};
                    for (var j = arg + 1; j < floors.length; j++) { 
                        var floor = indoorMap.mall.getFloor(floors[j]._id);
                        coords[floors[j]._id] = floor.position.z;
                        end[floors[j]._id] = this.atNormalPosition ? floor.position.z + interval : floor.position.z - interval;//加大间隔or减小间隔
                    }
                    var tween=new TWEEN.Tween(coords) 
                        .to(end,1000)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onUpdate(function(){//注意：有个requestAnimationFrame中在update Tween
                            for (var k = arg + 1; k < floors.length; k++) { 
                                var floor = indoorMap.mall.getFloor(floors[k]._id);
                                floor.position.z=coords[floors[k]._id];
                            }
                        })
                        .start();                    
                    this.atNormalPosition = !this.atNormalPosition;
                }
                
            }
            _uiRoot.appendChild(li);
        })(i);
    }
    return _uiRoot;
}