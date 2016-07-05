var Client = require('./Client');
var Server = require('./Server');
var Boardcast = require('./Boardcast');
var Path = require('path');

module.exports = function (app)
{
    return new RPC(app);
};

// TODO: 连接这一块需要重构
var RPC = function (app)
{
    this.clients = {};
    this.idToURL = {};

    app.rpc = {};
    app.getRPCURL = app.bind(this.getURL, this);

    var selfname = app.local.name;
    var selfport = app.local.port;
    var servers = app.config.Server;
    var rpcRemote = app.config.Server[selfname].rpcRemote;

    rpcRemote.forEach(function(serverName){
        var serverConfig = servers[serverName];
        this.connect(app, serverConfig, serverName, selfname, selfport);
    }, this);

    // 建立广播
    if(rpcRemote.indexOf('connector') != -1) {
        Boardcast(app, this.clients['connector']);
    }

    // 建立服务器
    Server(app, {
        'port': app.port,
        'protocol': ''
    });
};

var pro = RPC.prototype;

pro.connect = function (app, serverConfig, serverName, selfname, selfport) {
    var clients = {};

    var serverlist = serverConfig.list;
    for (var i = 0, len = serverlist.length; i < len; i++) {
        var server = serverlist[i];
        if (serverName == selfname && server.port == selfport) continue;
        var client = Client(app, {
            'host': server.host,
            'port': server.port,
            'protocol': '',
        });
        clients[client.url] = client;
        this.idToURL[server.id] = client.url;
    }
    this.clients[serverName] = clients;

    var self = this;

    var fileNameList = app.io.getFileNameList('app/' + serverName, '.js');
    for (var i = 0, len = fileNameList.length; i < len; i++) {
        var fileName = Path.basename(fileNameList[i]);
        if (app.rpc[fileName] != null) {
            app.log.err('Handle命名重复: ' + fileName);
            return;
        }

        self.buildRPC(app, clients, fileName, serverName);
    }
};

pro.buildRPC = function (app, clients, cmd, serverName) {
    var self = this;

    app.rpc[cmd] = function (param, data, schema, session, cb) {
        self.sendMessage(app, serverName, param, cmd, data, schema, session, cb);
    };
};

pro.sendMessage = function (app, serverName, param, cmd, data, schema, session, cb) {
    if (param == null) param = {};
    var url = param.url;
    var key = param.key;

    var clients = this.clients[serverName];

    if (url == null) {
        app.dispatch.get(key, serverName, function (err, url) {
            if (err) return cb(err);

            var client = clients[url];
            if (client == null) {
                return cb('没有对应服务器url。 命令: ' + cmd + ' url: ' + url);
            }
            client.sendMessage(cmd, data, schema, session, cb);
        });
    }
    else if (url == 'all') {
        for (var url in clients) {
            clients[url].sendMessage(cmd, data, schema, session, cb);
        }
    }
    // 指定url发送
    else {
        var client = clients[url];
        if (client == null) {
            return cb('没有对应服务器url。 命令: ' + cmd + ' url: ' + url);
        }

        client.sendMessage(cmd, data, schema, session, cb);
    }
};

pro.getClients = function (name) {
    return this.clients[name];
};

pro.getURL = function (id) {
    return this.idToURL[id];
};