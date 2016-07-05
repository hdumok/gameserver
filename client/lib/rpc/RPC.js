var Client = require('./Client');

module.exports = function (app)
{
    return new RPC(app);
};

// TODO: 连接这一块需要重构

var RPC = function (app){
    app.rpc = {};

    var servers = app.config.Server;
    var self = this;

    var clients = [];
    var serverList = servers['connector'].serverList;
    for (var i = 0, len =serverList.length; i < len; i++) {
        var server = serverList[i];
        clients.push(Client(app, {
            'serverId':server.serverId,
            'host': server.host,
            'port': server.port,
            'protocol': ''
        }));
    }
    app.rpcClients = clients;
    for(var serverType in servers) {
        app.loadFile('../app/' + serverType, function(path, fileName) {
            if (app.rpc[fileName] != null) {
                app.log.err('Handle命名重复: ' + fileName);
                return;
            }

            app.rpc[fileName] = function (id, data, schema, session, cb) {
                self.sendMessage(clients, id, fileName, data, schema, session, cb);
            };
        });
    }
};

var pro = RPC.prototype;

pro.sendMessage = function (clients, serverId, cmd, data, schema, session, cb) {
    if (serverId == null) {
        // TODO: 负载
        clients[0].sendMessage(cmd, data, schema, session, cb);
    }
    // 指定url发送
    else {
        for (var i = 0, len = clients.length; i < len; i++) {
            var client = clients[i];
            if (client.serverId == serverId){
                client.sendMessage(cmd, data, schema, session, cb);
                break;
            }
        }
    }
};