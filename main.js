
// TODOLIST:
// 1. rpc断线后转发处理（比如场景服务器断线，但是匹配服务器还记录断线的服务器）
// 2. redis连接状态加入错误判断
// 3. 加入pm2-webshell

var pm2 = require('pm2');

var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config/config.json', "utf8"));
var servers = (config.DebugMode) ? config.Server.Debug : config.Server.Release;

var apps = [];
for (var serverName in servers) {
    var list = servers[serverName].list;
    for (var i = 0, len = list.length; i < len; i++) {
        var server = list[i];
        apps.push({
            "name": server.id,
            "script": "./test_" + serverName + ".js",
            //"args" : {"ServerID": server.id},
            "exec_interpreter": "./nodejs/node"
        });
    }
}

pm2.connect(false, function(err){
    if (err) {
        console.log(err);
        process.exit(2);
    }

    pm2.start({"apps":apps}, function (err, apps){
        pm2.disconnect();
    });
});