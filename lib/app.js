var Config = require('./util/Config');
var Util = require('./util/Util');
var Log = require('./util/Log');

process.on('uncaughtException', function(err) {
        console.error("uncaughtException: \n" + err.stack);
    }
);

module.exports = function (id) {
    var app = {};

    // 加载所有进程的必要文件
    Config(app);
    Util(app);
    Log(app);

    // 获取当前服务器的名称
    var array = app.stringToArray(id, '-', true);
    var serverName = array[0];

    // 获取当前服务器的信息
    var serverInfos = app.config.Server;

    var serverInfo = serverInfos[serverName];
    if (serverInfo == null) {
        app.log.err('初始化服务器失败。没有服务器名称: ' + serverName);
        return;
    }

    app.local = null;
    var serverList = serverInfo.list;
    for (var i = 0, len = serverList.length; i < len; i++) {
        var server = serverList[i];
        if (server.id == id) {
            app.local = {
                'host': server.host,
                'port': server.port,
                'id': id,
                'name': serverName,
                'server': server
            };
            break;
        }
    }
    if (app.local == null) {
        app.log.err('初始化服务器失败。没有服务器id: ' + id);
        return;
    }

    // 挂载服务器组件
    var bootPath = app.config.BootPath;
    var boot = serverInfo.boot;
    for (var i = 0, len = boot.length; i < len; i++) {
        var path = bootPath[boot[i]];
        if (path == null) {
            app.log.err('初始化服务器失败。没有启动组件名称: ' + boot[i]);
            return;
        }

        var handle = require(path);
        if (handle == null) {
            app.log.err('初始化服务器失败。不存在启动组件路径: ' + path);
            return;
        }

        handle(app);
    }
};