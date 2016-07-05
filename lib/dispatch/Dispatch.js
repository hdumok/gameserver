
module.exports = function (app)
{
    return new Dispatch(app);
};

var Dispatch = function (app) {
    this.app = app;
    app.dispatch = this;


    this.localNum = 0;

//    if (app.local.server.dispatch) {
//        this.connectionNum = 0;
//        app.wsServer.onConnectionClose.push(app.bind(this.onConnectionClose, this));
//        app.wsServer.onConnectionSuccess.push(app.bind(this.onConnectionSuccess, this));
//    }
};

var pro = Dispatch.prototype;

//pro.onConnectionClose = function() {
//    this.app.redis.hmset('dispatch', this.app.local.id, --this.connectionNum);
//};
//
//pro.onConnectionSuccess = function () {
//    this.app.redis.hmset('dispatch', this.app.local.id, ++this.connectionNum);
//};

pro.add = function () {
    this.app.redis.hmset('dispatch', this.app.local.id, ++this.localNum);
};

pro.sub = function () {
    this.app.redis.hmset('dispatch', this.app.local.id, --this.localNum);
};

pro.reset = function () {
    this.app.redis.hmset('dispatch', this.app.local.id, this.localNum);
};

pro.get = function (key, serverName, cb) {
    var servers =  this.app.config.Server;
    var server = servers[serverName];

    if (server == null)
        return cb('配置里不存在服务器: ' + serverName);

    var method = (server.dispatch == null) ? 'default' : server.dispatch;

    if (this[method] == null) return cb('没有找到负载方法。 dispatch: ' + server.dispatch);

    this[method](key, serverName, server, cb);
};

// TODO: 并发量越大，误差越大，估计不会很大。
// TODO: 如果很大，不要传数组，利用lua进行递增（超过最大值返回失败）
pro.space = function(key, serverName, server, cb) {
    this.app.redis.hgetall('dispatch', function(err, data) {
        if (err) return cb(err);

        var max = server.dispatchMax;
        var list = server.list;

        for (var i = 0, len = list.length; i < len; i++) {
            var config = list[i];
            var num = data[config.id] || 0;

            if (num >= max) continue;

            return cb(null, config.host + ':' + config.port);
        }

        return cb('没有足够的rpc服务。rpc名称: ' + serverName);
    });
};

// TODO: 并发量越大，误差越大，估计不会很大。
// TODO: 如果很大，不要传数组，利用lua进行递增（超过最大值返回失败）
pro.min = function (key, serverName, server, cb) {
    this.app.redis.hgetall('dispatch', function(err, data) {
        if (err) return cb(err);

        var max = server.dispatchMax;
        var list = server.list;
        var min;
        var minConfig = null;

        for (var i = 0, len = list.length; i < len; i++) {
            var config = list[i];
            var num = data[config.id] || 0;

            if (num == 0) {
                minConfig = config;
                break;
            }

            if (max != null && num >= max) continue;

            if (min == null || num < min) {
                min == num;
                minConfig = config;
            }
        }

        if (minConfig == null) return cb('没有足够的rpc服务。rpc名称: ' + serverName);

        return cb(null, minConfig.host + ':' + minConfig.port);
    });
};

pro.rand = function (key, serverName, server, cb) {
    var list = server.list;
    var len = list.length;
    if (len == 0) return cb('rpc服务全部阵亡。rpc名称: ' + serverName);

    var config = list[Math.floor(Math.random() * len)];
    return cb(null, config.host + ':' + config.port);
};

pro.sessionMin = function (key, serverName, server, cb) {
    var self= this;
    self.app.redis.hget('session:' + key, serverName + 'ID', function (err, id) {
        if (err) return cb(err);

        if (!self.app.isNullOrEmpty(id)) {
            var url = self.app.getRPCURL(id);
            if (url == null) return self.min(key, serverName, server, cb);
            return cb(null, url);
        }

        self.min(key, serverName, server, cb);
    });
};

pro.sessionSpace = function (key, serverName, server, cb) {
    var self= this;
    self.app.redis.hget('session:' + key, serverName + 'ID', function (err, id) {
        if (err) return cb(err);

        if (!self.app.isNullOrEmpty(id)) {
            var url = self.app.getRPCURL(id);
            if (url == null) return self.space(key, serverName, server, cb);
            return cb(null, url);
        }

        self.space(key, serverName, server, cb);
    });
};

// TODO: 参考网易柚子的crc算法或者哈希算法，或者环状令牌算法
pro.default = function(key, serverName, server, cb) {
    if (key == null) {
        return cb('负载没有传入玩家key');
    }
    var list = server.list;
    if (list.length == 0) return cb('rpc服务全部阵亡。rpc名称: ' + serverName);
    var config = list[0];
    return cb(null, config.host + ':' + config.port);
};