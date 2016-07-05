module.exports = function (app)
{
    return new CacheGate(app);
};

var CacheGate = function (app) {
    this.app = app;
    app.cachegate = this;

    this.groupID = 0;
    this.cacheTables = {}; //内容信息 根据table key分类 值为url
    this.cacheClient = {};  //连接信息 table url分类 值为num

    this.registerCache(app);
};

var pro = CacheGate.prototype;

pro.registerCache= function (app) {
    var cacheConfig = app.config.Server.cache;

    if(cacheConfig == null){
        this.app.log.err('找不到cache服务器的配置');
        return;
    }

    var serverList = cacheConfig.serverList;
    if(serverList == null){
        this.app.log.err('未配置cache服务器');
        return;
    }

    for(var i = 0; i < serverList.length; i++) {
        var table = serverList[i].table;
        var serverId = serverList[i].serverId;
        var maxNum = this.app.config.MaxCacheNum[table] || this.app.config.MaxCacheNum['default'];

        if (this.cacheClient[table] == null) {
            this.cacheClient[table] = {};
        }

        this.cacheClient[table][serverId] = {
            num : 0,
            maxNum : maxNum
        }; //num可以成为一个属性

        if (this.cacheTables[table] == null) {
            this.cacheTables[table] = {};
        }
    }
};

pro.getID = function (table, key) {
    if (this.cacheTables[key]) return this.cacheTables[key]

    var tempTable = this.cacheClient[table];
    if (tempTable == null) {
        this.app.log.err('cache没有表: ' + table);
        return null;
    }

    var minNum = 99999999;
    var minID = null;

    for (var serverId in tempTable) { //找出最小的那个url
        var maxNum = tempTable[serverId].maxNum;
        var num = tempTable[serverId].num;
        if (num >= maxNum) continue;
        if (num < minNum) {
            minID = serverId;
            minNum = num;
        }
        console.error(tempTable[serverId])
    }

    if(minID != null){
        //TODO:缺少num--的操作，没有缓存淘汰机制
        this.cacheClient[table][minID].num++;
        this.cacheTables[key] = minID;
    }

    return minID;
};

pro.addGroupID = function () {
    return ++this.groupID;
};