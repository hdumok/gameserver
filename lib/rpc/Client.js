var WSClient = require('../ws/Client');
var Handle = require('./ClientHandle');

module.exports = function (app, config)
{
    return new Client(app, config);
};

var Client = function (app, config)
{
    this.app = app;

    // 连接服务器地址
    this.url = config.host + ':' + config.port;

    this.requestID = app.config.BoardcastNum;

    // TODO: 超时处理（单个超时处理还是整个超时处理）
    this.requestCallbacks = {};
    this.requestCaches = [];

    var client = WSClient(app, {
        'url': this.url,
        'protocol': config.protocol + '',
    });

    client.processBinaryMessage = app.bind(this.processBinaryMessage, this);
    client.connectionSuccess = app.bind(this.connectionSuccess, this);
    client.connectionError = app.bind(this.connectionError, this);
    client.connectionClose = app.bind(this.connectionClose, this);

    this.client = client;
    app.wsClient = this;
    return this;
};

var pro = Client.prototype;

pro.sendMessage = function (cmd, data, schema, session, cb) {
    var connection = this.client.connection;
    var requestID = null;
	
    if (cb == null) {
        requestID = -1;
    }
    else {
        requestID = ++this.requestID;
        this.requestCallbacks[requestID] = cb;
    }

    if (connection == null) {
        this.requestCaches.push({
            'id': requestID,
            'cmd': cmd,
            'data': data,
            'schema': schema,
            'session': session,
        });
    }
    else {
        Handle.send(this.app, connection, requestID, cmd, data, schema, session);
    }
};

pro.processBinaryMessage = function (app, connection, message) {
    Handle.process(app, connection, message, this.requestCallbacks)
};

pro.connectionError = function (app, connection, error) {
};

pro.connectionClose = function (app, connection, code, reason) {
};

pro.connectionSuccess = function (app, connection) {
    for (var i = 0, len = this.requestCaches.length; i < len; i++) {
        var requestCache = this.requestCaches[i];
        Handle.send(app,
                            connection,
                            requestCache.id,
                            requestCache.cmd,
                            requestCache.data,
                            requestCache.schema,
                            requestCache.session);
    }
    this.requestCaches = [];
};