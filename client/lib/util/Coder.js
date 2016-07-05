var fs = require('fs');
var protobuf = require('protocol-buffers');

module.exports = function (app) {
    return new Coder(app);
};

var Coder = function (app) {
    this.app = app;
    app.coder = this;

    this.proto = protobuf(fs.readFileSync('../'+ app.config.ProtoPath));

    console.log('加载全局编解码完成');
};

var pro = Coder.prototype;

pro.protoToJson = function (buf, schema) { //protobuf 转 json对象
    var proto = this.proto[schema];
    if (proto == null) {
        this.app.log.err('decode proto error by schema: ' + schema);
        return null;
    }

    try {
        return proto.decode(buf);
    }
    catch (exception) {
        this.app.log.err('protoToJson error by schema: ' + schema);
        return null;
    }
};

pro.jsonToProto = function (obj, schema) { //json对象 转 protobuf
    var proto = this.proto[schema];
    if (proto == null) {
        this.app.log.err('encode proto error by schema: ' + schema);
        return null;
    }

    try {
        return proto.encode(obj); ///????
    }
    catch (exception) {
        this.app.log.err('jsonToProto error by schema: ' + schema + ' obj: ' + JSON.stringify(obj));
        return null;
    }
};

pro.parse = function (json) {  //bufjson 转 buffer对象
    if (json == '') return '';
    return JSON.parse(json, function (key, value) {
        return value && value.type === 'Buffer'
            ? new Buffer(value.data)
            : value;
    });
};

pro.stringify = function (obj) { //buffer对象 转 bufjson
    return JSON.stringify(obj);
};