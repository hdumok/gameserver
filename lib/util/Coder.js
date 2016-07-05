
module.exports = function (app) {
    return new Coder(app);
};

var Coder = function (app) {
    this.app = app;
    app.coder = this;

    var fs = require('fs');
    var protobuf = require('protocol-buffers');

    this.proto = protobuf(fs.readFileSync(app.config.ProtoPath));

    console.log('加载全局编解码完成');
};

var pro = Coder.prototype;

pro.protoToObj = function (buf, schema) {
    var proto = this.proto[schema];
    if (proto == null) {
        this.app.log.err('decode proto error by schema: ' + schema);
        return null;
    }

    try {
        return proto.decode(buf);
    }
    catch (exception) {
        this.app.log.err('protoToObj error by schema: ' + schema);
        return null;
    }
};

pro.objToProto = function (obj, schema) {
    var proto = this.proto[schema];
    if (proto == null) {
        this.app.log.err('objToProto error by schema: ' + schema + ' obj: ' + this.objToJSON(obj));
        return null;
    }

    try {
        return proto.encode(obj);
    }
    catch (exception) {
        this.app.log.err('objToProto error by schema: ' + schema + ' obj: ' + JSON.stringify(obj));
        return null;
    }
};

pro.jsonToObj = function (json) {
    if (json == '') return '';
    return JSON.parse(json, function (key, value) {
        return value && value.type === 'Buffer'
            ? new Buffer(value.data)
            : value;
    });
};

pro.objToJSON = function (obj) {
    return JSON.stringify(obj);
};