var log4js = require('log4js');

module.exports = function (app) {
    return new Log(app);
};

var Log = function (app) {
    app.log = this;

    console.log('加载全局日志完成');
    log4js.configure(app.config.LogPath,{});
};

var pro = Log.prototype;

pro.err = function (log) {
    log4js.getLogger('error').error(log);
};