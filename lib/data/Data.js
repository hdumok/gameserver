
module.exports.get = function (app, table, key, fields, cb) {
    app.rpc.cachegate(null, null, null, {
        table: table,
        type: 'get',
        key: key,
        ingoreLock: false, //不无视别人的锁
        lock: false,  //自己也不去加锁
        fields: fields
    }, cb);
};

module.exports.getIngoreLock = function (app, table, key, fields, cb) {
    app.rpc.cachegate(null, null, null, {
        table: table,
        type: 'get',
        key: key,
        ingoreLock: true,
        lock: false,
        fields: fields
    }, cb);
};

// TODO: 中间有步骤err需不需要unlock
module.exports.set = function (app, table, key, fields, handle, cb) {
    //console.debug('发出 get')
    app.rpc.cachegate(null, null, null, {
        table: table,
        type: 'get',
        key: key,
        ingoreLock: false, //不无视别人的锁
        lock: true,  //自己要加锁
        fields: fields
    }, function (err, data, schema, msg) {
        //console.debug('get 的回调')
        //console.debug(arguments)
        if (err != null) return cb(err);

        app.invoke(handle, msg);
        app.rpc.cachegate(null, null, null, {
            table: table,
            type: 'set',
            key: key,
            ingoreLock: false, //不无视别人的锁
            groupID: msg.lockGroupID, //调用组和id
            lock: false, //自己也不加锁
            fieldValues: msg
        }, cb);
    });
};
