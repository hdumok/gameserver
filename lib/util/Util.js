var Path = require('path');

module.exports = function (app) {
    return new Util(app);
};

var Util = function (app) {
    app.invoke = this.invoke;
    app.bind = this.bind;
    app.isNullOrEmpty = this.isNullOrEmpty;
    app.stringToArray = this.stringToArray;
};

var pro = Util.prototype;

pro.invoke = function (func, self) {
    if(typeof func === 'function') {
        return func.apply(self, Array.prototype.slice.call(arguments, 1));
    }
    // TODO: 后期可以采用events的方式进行事件注册，取消该函数
    else if (func instanceof Array) {
        for (var i = 0, len = func.length; i < len; i++)
            func[i].apply(self, Array.prototype.slice.call(arguments, 1));
    }
};

pro.bind = function (func, self) {
    return func.bind(self);
};

pro.isNullOrEmpty = function (data) {
    return (data || '') == '';
};

pro.stringToArray = function (str, flag, value) {
    if ('number' === typeof(str))
        return [str];

    flag = (flag || '|');
    var ret = [];
    var values = str.split(flag);
    for (var i = 0; i < values.length; i++)
        ret.push((value) ? values[i] : parseInt(values[i]));
    return ret;
};