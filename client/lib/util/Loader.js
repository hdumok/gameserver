var fs = require('fs');
var Path = require('path');

module.exports = function (app) {
    return new Loader(app);
};

var Loader = function (app) {
    this.app = app;

    app.handles = {};

    app.loadFile = this.loadFile;

    console.log('加载全局资源完成');
};

var pro = Loader.prototype;

pro.loadFile = function (path, cb) {
    var files = fs.readdirSync(path);
    for (var i = 0, len = files.length; i < len; i++)
    {
        var file = files[i];
        var filePath = Path.join(path, file);
        if (fs.statSync(filePath).isDirectory())
        {
            this.loadFile(filePath, cb);
            continue;
        }

        var extname = Path.extname(file);
        if (extname.toLowerCase() != '.js') continue;

        var fileName = Path.basename(file, '.js');
        cb(path, fileName);
    }
};