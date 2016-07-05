
module.exports = function (app)
{
    return new Cache(app);
};

// TODO: 解决cache层面碰到list的情况
// TODO: lock锁数量控制
// TODO: 优化死锁处理性能（将死锁时间长的排在前面）
var Cache = function (app) {
    app.cache = this;
    this.app = app;

    var server = app.config.Server;
    this.table = server[app.local.name].cache;
    if (this.table == null) app.log.err('服务器不存在指定cache。服务器名称: ' + app.local.name);

    // 缓存集合
    this.caches = {};

    this.groupID = 0;

    this.maxCacheNum = app.config.MaxCacheNum[this.table];
    if (this.maxCacheNum == null) this.maxCacheNum = app.config.MaxCacheNum['default'];

    this.maxCacheLockNum = app.config.MaxCacheLockNum[this.table];
    if (this.maxCacheLockNum == null) this.maxCacheLockNum = app.config.MaxCacheLockNum['default'];

    // TODO: 有两种方式存储
    // 1. 存储key对应的cache（只要保存key） 数据库使用save --目前的方式
    // 2. 只存储key对应操作过的cache（要保存对象） 数据库使用upsert
    // 需要保存的集合
    this.saves = {};
    // 需要从缓存删除的集合
    this.deletes = {};

    // 锁集合
    this.locks = {};
    // 锁队列
    this.lockQueue = {};

    // TODO: 有两种方式落地
    // 1. 每次set后，开始为set的key独立计时，保存该key的cache
    // 2. 整体计时，保存整个saves的cache  --目前的方式
    app.setInterval(app.config.SaveCacheTime, app.bind(this.save, this));
};

var pro = Cache.prototype;

pro.register = function (key, cb) {
    var self = this;

    if (self.isExist[key]) return cb(null, self.caches[key]);

    this.app.mongo.get(this.table, {'Key': key}, {}, function (err, data) {
        if (err) {
            return cb(err);
        }

        if (data == null) data = {'Key': key};

        if (self.app.dispatch.localNum >= self.maxCacheNum) {
            return cb(null, data);
        }

        self.caches[key] = data;

        cb(null, data);
    });
};

pro.addGroupID = function () {
    return this.groupID++;
};

pro.isExist = function (key) {
    return this.caches[key] != null;
};

pro.getValue = function (cache, field) {
    if (cache == null) return null;

    var props = field.split('.');
    var prop;
    for (var i = 0, len = props.length; i < len; i++) {
        prop = props[i];
        cache = cache[prop];
        if (cache == null) return null;
    }
    return cache;
};

pro.setValue = function (cache, field, value) {
    // 一开始应该不需要重新绑定
    //if (cache == null) cache = {};

    var props = field.split('.');
    var prop;
    var temp = cache;
    var i = 0;
    for (var len = props.length -1; i < len; i++) {
        prop = props[i];
        if (temp[prop] == null) temp[prop] = {};
        temp = temp[prop];
    }
    temp[props[i]] = value;
    return cache;
};

pro.pushLockQueue = function (key, groupID, type, param, lock, cb) {
    if (this.lockQueue[key] == null) this.lockQueue[key] = [];

    if (this.lockQueue[key].length >= this.maxCacheLockNum) return false;

    this.lockQueue[key].push({
        groupID: groupID,
        param: param,
        lock: lock,
        type: type,
        cb: cb
    });
    return true;
};

pro.invokeLockQueue = function (key) {
    var lockQueue = this.lockQueue[key];
    if (lockQueue == null) return;

    var lockOP = lockQueue[0];

    var func = this[lockOP.type];
    if (func == null) {
        this.app.log.err('操作Cache时未找到: ' + lockOP.type);
        return;
    }

    lockQueue.splice(0, 1);

    func = this.app.bind(func, this);
    func(key, lockOP.groupID, false, lockOP.lock, lockOP.param, lockOP.cb);

    if (lockQueue.length == 0) {
        delete this.lockQueue[key];
    }
};

pro.get = function (key, fields, cb) {
    var self = this;

    if (self.isExist(key)) {
        var cache = self.caches[key];

        var values = {};
        var field;
        for (var i = 0, len = fields.length; i < len; i++) {
            field = fields[i];
            values[field] = self.getValue(cache, field);
        }

        return cb(null, values);
    }
    else {
        // TODO: 数据库操作
        if (self.locks[key] != null)
            delete this.locks[key];
        self.invokeLockQueue(key);
        return cb('数据库操作还未做');
    }
};

pro.set = function (key, fieldValues, cb) {
    var self = this;

    if (self.isExist(key)) {
        var cache = self.caches[key];

        for (var field in fieldValues) {
            self.setValue(cache, field, fieldValues[field]);
        }

        self.saves[key] = true;
        return cb();
    }
    else {
        // TODO: 数据库操作
        if (self.locks[key] != null)
            delete this.locks[key];
        self.invokeLockQueue(key);
        return cb('数据库操作还未做');
    }
};

pro.pipeline = function (key, cb) {
    var self = this;

    var groupID = self.addGroupID();

    var cbLen = arguments.length;
    var cbs = [];
    for (var i = 2; i < cbLen; i++) {
        var callback = arguments[i];
        if (!(typeof callback === 'function')) {
            return cb('管道建立失败，存在非函数参数。参数: ' + callback);
        }

        cbs[i - 2] = callback;
    }

    cbLen -= 2;
    var index = 0;
    var unLock;
    var next = function (err) {
        unLock = !self.app.isNullOrEmpty(err);
        if (unLock) {
            cb(err);
            self.unLock(key, groupID);
            return;
        }

        if (index < cbLen ) {
            var args = Array.prototype.slice.call(arguments, 1);
            args.push(next);
            cbs[index++].apply(null, args);
        }
        else if (!unLock) {
            cb.apply(null, Array.prototype.slice.call(arguments));
            self.unLock(key, groupID);
        }
    }

    if (cbLen < 1) return next('管道建立失败，没有参数函数。')

    if (this.lock(key, groupID))
        next(null);
    else
        next('管道建立失败，锁失效');
};

pro.unLock = function (key, groupID) {
    var lockData = this.locks[key];
    if (lockData == null) return;

    if (lockData.groupID != groupID) return;

    delete this.locks[key];

    this.invokeLockQueue(key);
};

pro.lock = function (key, groupID) {

    if (this.locks[key] != null) {
        var curGroupID = this.locks[key].groupID;

        // 重复锁
        if (groupID == curGroupID) {
            // TODO: 重复锁可以做成时间刷新
            return false;
        }

        // 无效死锁
        if (groupID < curGroupID) {
            return false;
        }

        if (groupID > curGroupID) {
            return this.pushLockQueue(key, groupID, 'get', fields, lock, cb);
        }
    }

    this.locks[key] = {
        'time': (new Date()).getTime(),
        'groupID': groupID
    }
    return true;
};

pro.save = function () {
    var self = this;
    for (var key in this.saves) {
        var cache = this.caches[key];
        self.app.mongo.save(this.table, key, cache, function (err, key) {
            if (err) return;

            delete self.saves[key];
        });
    }

    for (var key in this.deletes) {
        var cache = this.caches[key];
        self.app.mongo.save(this.table, key, cache, function (err, key) {
            if (err) return;

            delete self.deletes[key];
            delete self.caches[key];
        });
    }

//    var curTime = (new Date()).getTime();
//    for (var key in this.locks) {
//        if (this.locks[key] == null) continue;
//        var time = this.locks[key].time;
//        if (curTime - time >= this.app.config.MaxCacheLock) {
//            this.app.log.err('出现死锁 表格: ' + this.table + ' 关键字: ' + key);
//            delete this.locks[key];
//        }
//    }
};

pro.unRegister = function (key) {
    var self = this;
    if (self.saves[key] == null) {
        delete self.caches[key];
        return;
    }
    self.app.mongo.save(this.table, key, self.caches[key], function (err, key) {
        delete self.saves[key];
        if (err) {
            self.deletes[key] = true;
            return;
        }
        delete self.caches[key];
    });
};