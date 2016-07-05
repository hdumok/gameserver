 var Util = require('util');
var MongoDB = require('mongodb');

module.exports = function (app) {
    return new Mongo(app);
};

// TODO: mongo还未连接，数据就开始传输未处理
var Mongo = function (app) {
    this.app = app;
    var self = this;
    var config = app.config.Mongo;

    var url = Util.format("mongodb://%s:%s@%s:%d/%s",
        config.user,
        config.password,
        config.ip,
        config.port,
        config.name);

    MongoDB.MongoClient.connect(url, config.param, function(err, db) {
        if (err) {
            app.log.err('连接数据库失败 地址: ' + err);
            throw err;
        }

        console.log('成功连接数据库 地址: ' + url);

        db.on('close', function() {
            app.log.err('数据库连接断开 地址: ' + url);
        });

        self.db = db;
    });

    app.mongo = this;
};

var pro = Mongo.prototype;

pro.getTable = function (table, cb) {
    var self = this;
    if(this.db == null){
        return cb("数据库连接不存在");
    }

    this.db.collection(table, function (err, collection)
    {
        if (err ) {
            self.app.log.err('查询表格错误 表格名: ' + table +
                                    ' 原因' + err);
            cb('fail');
            return;
        }

        cb(null, collection);
    });
};

// table: 表格名
// query: 选择条件
// field: 显示数据
pro.get = function (table, query, field, cb) {
    var self = this;

    this.getTable(table, function (err, collection) {
        if (err) {
            cb(err);
            return;
        }

        collection.findOne(query, field, function (err, data) {
            if (err) {
                self.app.log.err('查询单个数据错误 表格名: ' + table +
                                        ' 查询集: ' + JSON.stringify(query) +
                                        ' 显示集: ' + JSON.stringify(field) +
                                        ' 原因: ' + err);
                cb('fail');
                return;
            }
            console.debug("getTable获取到数据库数据：" + JSON.stringify(data))
            cb(null, data);
        });
    });
};

// table: 表格名
// query: 选择条件
// field: 显示数据
// other: 例如{sort:'value':-1}
pro.getAll = function (table, query, field, other, cb) {
    var self = this;

    this.getTable(table, function (err, collection) {
        if (err) {
            cb(err);
            return;
        }

        collection.find(query, field, other).toArray(function (err, docs) {
            if (err) {
                self.app.log.err('查询多个数据错误 表格名: ' + table +
                                        ' 查询集: ' + JSON.stringify(query) +
                                        ' 显示集: ' + JSON.stringify(field) +
                                        ' 附加集: ' + JSON.stringify(other) +
                                        ' 原因: ' + err);
                cb('fail');
                return;
            }

            cb(null, docs);
        });
    });
};

// table: 表格名
// query: 选择条件
// updatefield: 更新数据
// deleteField: 卸载数据
pro.upsert = function (table, query, updatefields, deleteFields, cb) {
    var self = this;

    this.getTable(table, function (err, collection) {
        if (err) {
            cb(err);
            return;
        }

        collection.update(query, {$set: updatefields, $unset : deleteFields}, {upsert: true}, function (err) {
            if (err) {
                self.app.log.err('更新数据错误 表格名: ' + table +
                                        ' 查询集: ' + JSON.stringify(query) +
                                        ' 插入集: ' + JSON.stringify(updatefields) +
                                        ' 删除集: ' + JSON.stringify(deleteFields) +
                                        ' 原因: ' + err);
                cb('fail');
                return;
            }
            cb(null);
        });
    });
};

pro.save = function (table, key, data, cb) {
    var self = this;

    this.getTable(table, function (err, collection) {
        if (err) {
            cb(err);
            return;
        }

        collection.save(data, function (err){
            if (err)
            {
                self.app.log.err('保存数据错误 表格名: ' + table +
                                        ' 数据: ' + JSON.stringify(data) +
                                        ' 原因: ' + err);
                cb('fail');
                return;
            }
            cb(null, key);
        });
    });
};

