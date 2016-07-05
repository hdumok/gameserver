var Http = require('http');
var WebSocketServer = require('websocket').server;

module.exports = function (app, config)
{
    return new Server(app, config);
};

// TODO: 异常监听消息是否完全，比如connection error或者其他
var Server = function (app, config) {

    var self = this;

    // 连接成功
    self.connectionSuccess = null;
    // 处理http请求
    self.processHttpMessage = null;
    // 请求过滤
    self.originIsAllowed = null;
    // 处理utf消息
    self.processMessage = null;
    // 处理二进制消息
    self.processBinaryMessage = null;
    // 连接断开
    self.connectionClose = null;

    var httpServer = Http.createServer(function(request, response) {
        // 有监听http请求，则使用监听
        if (self.processHttpMessage != null) {
            app.invoke(self.processHttpMessage, app, request, response);
        }
        // 反之，404
        else {
            response.statusCode = 404;
            response.end();
        }
    });

    var wsServer = new WebSocketServer({
        httpServer: httpServer,
        autoAcceptConnections: false,
        keepaliveInterval: 5000, //5秒一次ping
        keepaliveGracePeriod: 10000  //收不到ping的10秒后关闭连接，会 emit 'close'
    });

    wsServer.on('request', function(request) {
        var origin = request.remoteAddress.slice(7) + ':' +　request.socket._peername.port;

        if (self.originIsAllowed != null && !app.invoke(self.originIsAllowed, app, origin)) {
            console.log('服务器因为黑名单而拒绝客户端访问。 客户端地址: ' + origin);
            request.reject();
            return;
        }

        try
        {
            var connection = request.accept(config.protocol + '', origin);
        }
        catch (exception)
        {
            app.log.err('握手验证失败。 protocol:' + config.protocol);
            return;
        }

        app.invoke(self.connectionSuccess, app);
        console.log('服务器有客户端连接。 客户端地址:' + origin);

        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                app.invoke(self.processMessage, app, connection, message.utf8Data);
            }
            else if (message.type === 'binary') {
                app.invoke(self.processBinaryMessage, app, connection, message.binaryData);
            }
        });

        connection.on('close', function(code, reason) {
            console.log('服务器和客户端连接断开。 客户端地址:' + origin + ' 代码: ' + code + ' 原因: ' + reason);
            app.invoke(self.connectionClose, app, connection, code, reason);
        });
    });

    httpServer.listen(config.port, function () { console.log('服务器正在监听端口: ' + httpServer.address().port) });

    this.wsServer = wsServer;
    return this;
};

var pro = Server.prototype;