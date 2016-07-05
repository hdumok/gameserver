var url = require('url');
var bodyPaser = require('body-parser');
var jsonPaser = bodyPaser.json();
var urlEncodedPaser = bodyPaser.urlencoded({extended:false});

var exp = module.exports;

exp.process = function (app, connection, message, onBoardcast) {

    var request = app.coder.protoToObj(message, 'Request');
    if (request == null) return;

    // 广播命令特殊处理
    if (onBoardcast != null && app.invoke(onBoardcast, request)) return;

    // 请求ID
    var id = request.ID;
    // 命令名称
    var cmd = request.CMD;
    // 通用proto数据
    var data = request.Data;
    // rpc专用session数据
    var session = request.Session;
    session = app.coder.jsonToObj(session);
    if (connection.key != null) session = {'key': connection.key};
    // schema
    var schema = request.Schema;
    // 如果schema为空，则默认schema是cmd名称（目前仅仅用于unity客户端传输消息）
    schema = (app.isNullOrEmpty(schema)) ? cmd : schema;

    // error: 错误信息
    // data: proto二进制数据或者proto结构体
    // schema: 如果data是proto二进制数据则为空
    // msg: utf字符串数据或者json数据
    var next = (id == -1) ? null : function (error, data, schema, msg) {
        exp.send(app, connection, id, error, data, schema, msg);
    };

    var handle = app.handles[cmd];
    if (handle != null) {
        var proto = {
            'origin': data,
            'schema': schema,
            'getData': function () { return app.coder.protoToObj(data, schema); }
        };
        handle(app, connection, proto, session, next);
        return;
    }

    if (app.rpc[cmd] == null) {
        app.log.err('RPC没有注册函数: ' + cmd);
        return;
    }

    // TODO: 这边response进行了二次转换，原因是要改变id。改进方案: id直接写在前面几位或后面几位二进制里
    app.rpc[cmd]({'key':connection.key}, data, schema, session, (id == -1) ? null : function(response) {
        response.ID = id;
        exp.sendResponse(app, connection, app.coder.objToProto(response, 'Response'));
    });
};

exp.send = function (app, connection, id, error, data, schema, msg) {
    var response = {};

    response.ID = id;

    if (!app.isNullOrEmpty(error)) {
        app.log.err(error);
        response.Error = error;
    }
    else {

        if (data != null) {
            response.Schema = schema;
            response.Data = (data instanceof Buffer) ? data : app.coder.objToProto(data, schema);
        }

        if (msg != null) {
            response.Msg = (typeof msg === 'string') ? msg : app.coder.objToJSON(msg);
        }
    }

    exp.sendResponse(app, connection, app.coder.objToProto(response, 'Response'));
};

exp.sendResponse = function (app, connection, response) {
    try {
        connection.sendBytes(response);
    }
    catch (exception) {
        app.log.err('服务器推送到客户端response错误: ' + exception);
    }
};

exp.processHttp =  function(app, request, response) {
    var urldata =  url.parse(request.url);
    var httpCmd = urldata.pathname.slice(1);
    var handle = app.httpHandles[httpCmd];
    if (handle == null) {
        app.log.err('没有对应的Http方法： ' + httpCmd)
        return;
    }

    if (request.method == 'GET'){
        handle(app, request, response, urldata);
    }
    else if(request.method == 'POST'){
        //application/json格式post
        jsonPaser(request, response, function(error, bodydata){
            if(error != null){
                app.log.err('json方式解码失败, 原因：' +　error);
                return;
            }

            if(bodydata != null) {
                handle(app, request, response, urldata, bodydata);
                return;
            }

            //application/x-www-form-urlencoded格式post
            urlEncodedPaser(request, response, function(error, bodydata){
                if(error != null){
                    app.log.err('json方式解码失败, 原因：' +　error);
                    return;
                }

                if(bodydata != null) {
                    handle(app, request, response, urldata, bodydata);
                    return;
                }

                app.log.err('http请求解码body失败')
            })
        })
    }
};