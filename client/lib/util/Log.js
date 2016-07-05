var log4js = require('log4js');

module.exports = function (app) {
    return new Log(app);
};

var Log = function (app) {
    app.log = this;

    log4js.configure({
        "appenders": [
            {"type": "console"},
            {
                "type": "dateFile",
                "filename": "logs/error/",
                "pattern": "yyyy-MM-dd.txt",
                "alwaysIncludePattern": true,
                "maxLogSize": 1048576,
                "category": "error"
            }
        ],

        "levels":{
            "[all]":"LOG"
        },

        "replaceConsole": true,
        "lineDebug": true
    });

    console.log('加载全局日志完成');
};

var pro = Log.prototype;

pro.err = function (log) {
    //log4js.getLogger('error').error(log);
    console.error(log);
};