var WebSocketClient = require('websocket').client;

module.exports = function (app, config)
{
    return new Client(app, config);
};

var Client = function (app, config)
{
    // 被连接服务器的地址
    this.url = ((config.wss) ? 'wss://' : 'ws://') + config.url;
    // 连接协议
    this.protocol = config.protocol + '';

    var self = this;

    // TODO: 不知道干嘛的，难道兼容http和https请求
    //self.httpResponse = null;  ?????
    // 客户端连接服务器失败
    self.connectFailed = null;
    // 处理utf消息
    self.processMessage = null;
    // 处理二进制消息
    self.processBinaryMessage = null;
    // 客户端连接服务器成功
    self.connectionSuccess = null;
    // 客户端连接服务器过程中出错
    self.connectionError = null;
    // 客户端连接服务器宕掉
    self.connectionClose = null;

    var wsClient = new WebSocketClient();

    //wsClient.on('connectFailed', function(error) {
    //    self.reconnect();
    //});

    wsClient.once('connectFailed', function(error) {
        console.error('客户端连接服务器失败。 服务器地址:' + self.url + ' 服务器协议:' + self.protocol + ' 原因: ' + error.toString());
        app.invoke(self.connectFailed, app, error);
    });

    wsClient.on('connect', function(connection) {
        console.log('客户端连接服务器成功。 服务器地址:' + self.url);

        self.connection = connection;
        app.invoke(self.connectionSuccess, app, connection);

        // TODO: 可以加入ping和pong，保证连接不出异常

        connection.on('error', function(error) {
            console.error('客户端连接服务器过程中出错。 服务器地址:' + self.url +' 原因: ' + error.toString());
            app.invoke(self.connectionError, app, connection, error);
        });

        connection.on('close', function(code, reason) {
            console.error('客户端连接服务器关闭。 服务器地址:' + self.url +' 代码: ' + code + ' 原因: ' + reason);
            app.invoke(self.connectionClose, app, connection, code, reason);
            //self.reconnect();
        });

        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                app.invoke(self.processMessage, app, connection, message.utf8Data);
            }
            else if (message.type === 'binary') {
                app.invoke(self.processBinaryMessage, app, connection, message.binaryData);
            }
        });
    });


    this.wsClient = wsClient;
    this.reconnect();
    return this;
};

var pro = Client.prototype;

// TODO: 最好能加入重连时间，防止一直在重连
pro.reconnect = function () {
    this.wsClient.connect(this.url, this.protocol);
};
