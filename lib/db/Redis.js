var IORedis = require('ioredis');
var Path = require('path');

module.exports = function (app)
{
    return new Redis(app);
};

// TODOLIST:
// 1. 数据表分开，目前只有session（测试分开性能，不知用client.select是否消耗）
var Redis = function (app) {
    this.app = app;

    var config =app.config.Redis;
    this.client = new IORedis(config.port, config.host, config.param);

    app.redis = this;

    /*
        基础操作
        set: 此命令用于在指定键设置值。 { key value  }
        get: 键对应的值。 { key }
        hdel: 删除一个或多个哈希字段。 { key field2 [field2] }
        hexists: 判断一个哈希字段存在与否。 { key field }
        hget: 获取存储在指定的键散列字段的值。 { key field }
        hgetall: 让所有的字段和值在指定的键存储在一个哈希。 { key }
        hmget: 获得所有给定的哈希字段的值。 { key field1 [field2] }
        hmset: 设置多个哈希字段的多个值。 { key field1 value1 [field2 value2 ] }
        hset: 设置哈希字段的字符串值。 { key field value }
        hsetnx: 设置哈希字段的值，仅当该字段不存在。 { key field value }
        hincrby: 由给定数量增加的哈希字段的整数值。 { key field increment }
     */
    var baseOP = ['set', 'get', 'hdel', 'hexists', 'hget', 'hgetall', 'hmget', 'hmset', 'hset', 'hsetnx', 'hincrby'];
    for(var i = 0, len = baseOP.length; i < len; i++) {
      var op = baseOP[i];
        //本身就是原子操作，定义成脚本还是原子操作，而且定义成脚本将导致回复的数据都是数组形式，难处理
        /*  this.client.defineCommand(op, {
            numberOfKeys: 1,
            lua: 'return redis.pcall("' + op +'", KEYS[1], unpack(ARGV));'
        });*/
        this[op] = app.bind(this.client[op], this.client);
    }

    // 读取redislua下面的额外操作
    var path = './redislua';
    var fileNameList = app.io.getFileNameList(path, '.lua');
    for (var i = 0, len = fileNameList.length; i < len; i++) {
        var fileName = fileNameList[i];
        var context = app.io.readFile(Path.join(path, fileName + '.lua'));

        var firstLine = context.split('\r\n')[0];
        var info = app.coder.jsonToObj(firstLine.substr(2));
        var lua = context.substr(firstLine.length + 2);
        this.client.defineCommand(info.nameOfCommand, {
            numberOfKeys: info.numberOfKeys,
            lua: lua
        });
        this[info.nameOfCommand] = app.bind(this.client[info.nameOfCommand], this.client);
    }
};

var pro = Redis.prototype;