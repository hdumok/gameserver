
module.exports = function (app, clients)
{
    return new Boardcast(app, clients);
};

var Boardcast = function (app, clients) {
    this.app = app;
    this.clients = clients;

    app.boardcast = {};

    app.boardcast.request = app.bind(this.sendRequest, this);
    app.boardcast.response = app.bind(this.sendResponse, this);
};

var pro = Boardcast.prototype;

// TODO: 好像并没有什么用...
pro.sendRequest = function (to, cmd, data, schema, session) {
    this.boardcast(this.app, this.clients, to, {
        'CMD': cmd,
        'Data': (data == null || data instanceof Buffer) ? data : this.app.coder.objToProto(data, schema),
        'Session': session,
        'Schema': schema,
    }, 'Request');
};

pro.sendResponse = function (to, id, error, data, schema, msg) {
    this.boardcast(this.app, this.clients, to, {
        'ID': id,
        'Error': error,
        'Data': (data == null || data instanceof Buffer) ? data : this.app.coder.objToProto(data, schema),
        'Schema': schema,
        'Msg': msg,
    }, 'Response');
};

pro.boardcast = function (app, clients, to, data, schema) {
    // TODO: 需不需要通过redis获取to的connector url？？？
    for (var url in clients) {
        clients[url].sendMessage(app.config.BoardcastKey, data, schema, {'to':to});
    }
};