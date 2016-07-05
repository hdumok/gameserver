var WSServer = require('../ws/Server');
var Handle = require('./ServerHandle');

module.exports = function (app) {
    return new Server(app);
};

var Server = function (app) {
    this.app = app;

    var server = WSServer(app, {
        autoAcceptConnections: false,
        protocol: app.local.protocol || '',
        port: app.local.port,
    });

    server.connectionSuccess = app.bind(this.connectionSuccess, this);
    server.processHttpMessage = app.bind(this.processHttpMessage, this);
    server.originIsAllowed = app.bind(this.originIsAllowed, this);
    server.processMessage = app.bind(this.processMessage, this);
    server.processBinaryMessage = app.bind(this.processBinaryMessage, this);
    server.connectionClose = app.bind(this.connectionClose, this);

    this.onBoardcast = [];
    this.onConnectionClose = [];
    this.onConnectionSuccess = [];

    this.server = server;
    app.wsServer = this;
    return this;
};

var pro = Server.prototype;

pro.sendResponse = function (app, connection, response) {
    Handle.sendResponse(app, connection, response);
};

pro.sendRequest = function (app, connection, resquest) {
    Handle.process(app, connection, resquest);
};

pro.processHttpMessage = function (app, request, response) {
    Handle.processHttp(app, request, response)
};

pro.processMessage = function (app, connection, message) {
};

pro.processBinaryMessage = function (app, connection, message) {
    Handle.process(app, connection, message, this.onBoardcast);
};

pro.connectionClose = function (app, connection, code, reason) {
    app.invoke(this.onConnectionClose, app, connection, code, reason);
};

pro.connectionSuccess = function (app) {
    app.invoke(this.onConnectionSuccess, app);
};

pro.originIsAllowed = function (app, origin) {
    return true;
};