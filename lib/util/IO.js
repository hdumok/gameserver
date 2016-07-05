var fs = require('fs');
var Path = require('path');

module.exports = function (app) {
    return new IO(app);
};

var IO = function (app) {
    app.io = this;
};

var pro = IO.prototype;

pro.getFileNameList = function (path, ext, root) {
    var fileNameList = [];
    var files = fs.readdirSync(path);
    for (var i = 0, len = files.length; i < len; i++)
    {
        var file = files[i];
        var filePath = Path.join(path, file);
        if (fs.statSync(filePath).isDirectory())
        {
            Array.prototype.push.apply(fileNameList, this.getFileNameList(filePath, ext, file));
            continue;
        }

        var extname = Path.extname(file);
        if (extname.toLowerCase() != ext) continue;

        var fileName = (root != null) ? Path.join(root , Path.basename(file, ext)) : Path.basename(file, ext);
        fileNameList.push(fileName);
    }
    return fileNameList;
};

pro.readFile = function (path) {
    return fs.readFileSync(path, 'utf-8');
};
