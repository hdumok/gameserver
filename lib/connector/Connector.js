
module.exports = function (app) {
    return new Connector(app);
};

var Connector = function (app) {
    this.app = app;
    this.connections = {};

    app.connector = this;

    app.wsServer.onConnectionClose.push(app.bind(this.onConnectionClose, this));
    app.wsServer.onBoardcast = app.bind(this.onBoardcast, this);

    app.dispatch.reset();
    return this;
};

var pro = Connector.prototype;

pro.onConnectionClose = function (app, connection, code, reason) {
    if (connection.key != null)
        this.unLogin(connection.key, connection);
};

pro.onBoardcast = function (request) {
    if (request.CMD == this.app.config.BoardcastKey) {
        var session = request.Session;
        if ((session || '') == '') {
            this.app.log.err('广播出错。 没有session');
            return;
        }
        session = JSON.parse(session);
        this.send(session.to, request.Data, request.Schema);
        return true;
    }
    return false;
};

pro.send = function (to, data, schema) {
    if (to == null) {
        this.app.log.err('广播发送消息没有to。');
        return;
    }

    var func = (schema == 'Request') ? this.app.wsServer.sendRequest : this.app.wsServer.sendResponse;
    if (to == 'all') {
        for (var key in this.connections) {
            func(this.app, this.connections[key], data);
        }
    }
    else if (typeof to === 'string') {
        var connection = this.connections[to];
        if (connection != null) func(this.app, connection, data);
    }
    else {
        for (var i = 0, len = to.length; i < len; i++) {
            var connection = this.connections[to[i]];
            if (connection != null) func(this.app, connection, data);
        }
    }
};

// 登陆情况分析:
// 1. 重复登陆 => a客户端在1线登陆用户A => a客户端在1线登陆用户A （connection相同，connectorID相同，key相同）
// 2. 覆盖登陆 => a客户端在1线登陆用户A => a客户端在1线登陆用户B （connection相同，connectorID相同，key不同）
// 3. 断线登陆 => a客户端在1线登陆用户A => a客户端在2线登陆用户A （connection不同，connectorID不同，key相同）
// 4. 断线登陆 => a客户端在1线登陆用户A => a客户端在2线登陆用户B （connection不同，connectorID不同，key不同）
// 5. 断线登陆 => a客户端在1线登陆用户A => b客户端在1线登陆用户A （connection不同，connectorID相同，key相同）
// 6. 断线登陆 => a客户端在1线登陆用户A => b客户端在2线登陆用户A （connection不同，connectorID不同，key相同）
// TODO: 分配登录cache
pro.login = function (key, secret, connection, cb) {
    var self = this;

    var connectionKey = connection.key;

    // 重复登陆
    // TODO: 重复登陆可以不用认证吗？
    if (connectionKey == key) {
        console.log('重复登录: ' + key);
        self.app.redis.hmset('session:' + key, 'secret', '');
        return cb();
    }

    self.app.redis.hgetall("session:" + key, function(err, session){
        if (err) return cb(err);

        // TODO: 进行secret认证
        //if (session.secret != secret) return cb('密匙验证失败');
       // session.secret = null;

        // 本线路断线登录
        if (self.connections[key] != null) {
            console.log('本线路断线登录: ' + key);
            self.unLogin(key, self.connections[key], true);
            self.connections[key] = connection;
            connection.key = key;
            self.app.redis.hmset('session:' + key, 'secret', '', 'connectorID', self.app.local.id);
            self.app.dispatch.add();
            return cb();
        }

        // 覆盖登陆
        if (connectionKey != null) {
            console.log('覆盖登陆: ' + key);
            self.unLoginData(connectionKey);
            connection.key = key;
            self.app.redis.hmset('session:' + key, 'secret', '', 'connectorID', self.app.local.id);
            self.app.dispatch.add();
            return cb();
        }

        // 其他线路断线登陆
        var connectorID = session.connectorID;
        if (!self.app.isNullOrEmpty(connectorID) && connectorID != self.app.local.id) {
            console.log('其他线路断线登陆: ' + key);
            var url = self.app.getRPCURL(connectorID);
            self.app.rpc.UnLoginCmd({'url':url}, null, null, null, {'crowd': true}, function (response) {
                self.connections[key] = connection;
                connection.key = key;
                self.app.redis.hmset('session:' + key, 'secret', '', 'connectorID', self.app.local.id);
                self.app.dispatch.add();
                return cb();
            });
            return;
        }

        self.connections[key] = connection;
        connection.key = key;
        self.app.redis.hmset('session:' + key, 'secret', '', 'connectorID', self.app.local.id);
        self.app.dispatch.add();
        console.log('登陆用户:' + key);
        return cb();
    });
};

pro.unLogin = function (key, connection, crowd) {
    if (connection == null || connection.key == null) return;
    connection.key == null;

    if (crowd) connection.close(this.app.config.CloseCode.Crowd, '已有玩家在其他机器登录');
    else connection.close();
    delete this.connections[key];

    this.unLoginData(key);
};

// TODO: 人物注销的操作
pro.unLoginData = function (key) {
    // 取消匹配
    this.app.rpc.PVPMatchCancelCmd({}, null, null, {'key': key});
    this.app.redis.hmset('session:' + key, 'connectorID', '');
    this.app.dispatch.sub();
    console.log('注销用户 key:' + key);
};

