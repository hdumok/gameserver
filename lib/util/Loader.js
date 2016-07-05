var fs = require('fs');
var Path = require('path');

module.exports = function (app) {
    return new Loader(app);
};

var Loader = function (app) {
    this.app = app;

    app.handles = {};
    app.httpHandles = {};
    this.loadHandle();
    this.loadHttpHandle();

    app.loadFiles = this.loadFiles;

    console.log('加载全局资源完成');
};

var pro = Loader.prototype;

pro.loadHandle = function () {
    var path = 'app/' + this.app.local.name;
    var fileNameList = this.app.io.getFileNameList(path, '.js');
    for (var i = 0, len = fileNameList.length; i < len; i++) {
        var fileName = fileNameList[i];
        if (this.app.handles[fileName] != null) {
            this.app.log.err('加载本地文件出错 文件名重复 路径: ' + fileName);
            return;
        }

        this.app.handles[Path.basename(fileName)] = require(Path.join('../../', path, fileName));
    }
};

pro.loadHttpHandle = function () {
    var path = 'http/' + this.app.local.name;
    var fileNameList = this.app.io.getFileNameList(path, '.js');
    for (var i = 0, len = fileNameList.length; i < len; i++) {
        var fileName = fileNameList[i];
        if (this.app.httpHandles[fileName] != null) {
            this.app.log.err('加载本地文件出错 文件名重复 路径: ' + fileName);
            return;
        }

        this.app.httpHandles[Path.basename(fileName)] = require(Path.join('../../', path, fileName));
    }
};