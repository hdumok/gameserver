var exp = module.exports;

exp.process = function (app, connection, message, requestCallbacks) {
    var response = app.coder.protoToObj(message, 'Response');
    if (response == null) return;

    var id = response.ID;

    var callback = requestCallbacks[id];
    if (callback == null) {
        app.log.err('RPC客户端无法处理回调。 回调ID: ' + id + ' 回调内容: ' + JSON.stringify(response));
        return;
    }
    delete requestCallbacks[id];

    response.getData = function () {
        return app.coder.protoToObj(response.Data, response.Schema);
    };

    callback(response);
};

exp.send = function (app, connection, id, cmd, data, schema, session) {
    var request = {
        ID: id,
        CMD: cmd,
    };

    if (data != null) {
        request.Schema = schema;
        request.Data = (data instanceof Buffer) ? data : app.coder.objToProto(data, schema);
    }

    if (session != null) {
        request.Session = (typeof session === 'string') ? session : app.coder.objToJSON(session);
    }

    connection.sendBytes(app.coder.objToProto(request, 'Request'));
};