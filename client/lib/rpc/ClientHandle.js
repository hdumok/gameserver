var exp = module.exports;

exp.process = function (app, connection, message, requestCallbacks) {
    var response = app.coder.protoToJson(message, 'Response');
    if (response == null) return;
    console.debug(response)
    var id = response.ID;
    var callback = requestCallbacks[id];
    if (callback == null) {
        app.log.err('RPC客户端无法处理回调。 回调ID: ' + id + ' 回调内容: ' + JSON.stringify(response));
        return;
    }
    if(id >10) delete requestCallbacks[id];

    var error = response.Error;
    var data = response.Data;
    var schema = response.Schema;
    var msg = response.Msg;

    if (error != '') {
        app.invoke(callback, error);
    }
    else {
        data = (schema !== '') ? app.coder.protoToJson(data, schema):null;
        msg = app.coder.parse(msg);
        app.invoke(callback, null, data, schema, msg)
    }
};

exp.send = function (app, connection, id, cmd, data, schema, session) {
    var request = {
        ID: id,
        CMD: cmd
    };

    if (data != null) {
        request.Schema = schema;
        request.Data = (data instanceof Buffer) ? data : app.coder.jsonToProto(data, schema); //protobuf
    }

    if (session != null) {
        request.Session = (typeof session === 'string') ? session : app.coder.stringify(session); //stringify
    }
    console.warn(request)
    connection.sendBytes(app.coder.jsonToProto(request, 'Request'));
};