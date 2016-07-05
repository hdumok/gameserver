
module.exports = function (app) {
    return new Util(app);
};

var Util = function (app) {
    app.invoke = this.invoke;
    app.bind = this.bind;
};

var pro = Util.prototype;

pro.invoke = function (func) {
    if(typeof func === 'function') {
        return func.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

pro.bind = function (func, self) {
    return func.bind(self);
};

