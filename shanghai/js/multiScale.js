var multiScaleFlag = false;
var toggleMultiScale = document.getElementById("startMultiScale").addEventListener('click', function () { 
    if (this.innerText === "关闭") { 
        //关闭多尺度展示
        this.innerText = "开始";
        multiScaleFlag = false;
        //TODO回到正常的只展示一个图层
        return;
    }

    //打开多尺度展示
    multiScaleFlag = true;
    this.innerText = "关闭";
    changeBuildings();
});