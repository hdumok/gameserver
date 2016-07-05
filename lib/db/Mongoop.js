
module.exports = function (app)
{
    return new Mongoop(app);
};

var Mongoop = function (app) {
    app.mongoop = this;
    this.app = app;

    // 锁集合
    this.locks = {};
    // 用到了锁的操作队列
    this.lockQueue = {};

    //TODO:以后改
    this.locks['user'] = {};
    this.lockQueue['user'] = {};
};

var pro = Mongoop.prototype;

pro.getMongo = function (table, key, cb) {
    this.app.mongo.get(table, {'Key': key}, {}, function (err, data) {
        if (err) {
            console.error("数据库获取数据失败")
            cb(err);
            return;
        }

        //找不到数据就初始化个空白进去
        if (data == null) data = {'Key': key};

        // TODO: 初始化需不需要返回数据
        cb(null, data);
    });
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

pro.setValue = function (table, key, fieldValues, cb) {
    var updatefields = {};
    var deletefields = {};

    for (var field in fieldValues) {
        if (fieldValues[field] != null) {
            updatefields[field] = fieldValues[field];
        }
        else{
            deletefields[field] = fieldValues[field];
        }
    }

    this.app.mongo.upsert(table, {Key : key}, updatefields, deletefields, function(err){
        if(err){
            console.error("数据库插入数据失败")
            cb(err);
        }

        cb();
    })
};

pro.pushLockQueue = function (table, key, groupID, type, param, lock, cb) {
    if (this.lockQueue[table][key] == null) this.lockQueue[table][key]  = [];
    this.lockQueue[table][key].push({
        groupID: groupID,
        type: type,
        param: param,
        lock: lock,
        cb: cb
    });
};

pro.invokeLockQueue = function (table, key) {
    var lockQueue = this.lockQueue[table][key];
    if (lockQueue == null) return;

    var lockOP = lockQueue[0];

    var func = this[lockOP.type]; //可改进
    if (func == null) {
        this.app.log.err('操作Mongo时未找到: ' + lockOP.type);
        return;
    }

    lockQueue.splice(0, 1);

    func = this.app.bind(func, this);
    func(table, key, lockOP.groupID, false, lockOP.lock, lockOP.param, lockOP.cb);

    if (lockQueue[table].length == 0) {
        delete this.lockQueue[table][key];
    }
};

pro.get = function (table, key, groupID, ingoreLock, lock, fields, cb) {
  var self = this;

  if (!ingoreLock) { //跟锁有关的操作
      if (this.locks[table][key] != null) {
            var lockGroupID = this.locks[table][key].groupID;
            // 无效死锁
            if (groupID < lockGroupID) {
              cb('无效死锁');
              return;
            }

        if (groupID > lockGroupID) {
          this.pushLockQueue(table, key, groupID, 'get', fields, lock, cb);
          return;
        }
      }

      if (lock) {  //加锁式操作
          self.locks[table][key] = {
              time: (new Date()).getTime(),
              groupID: groupID
        }
      }
      else {  //减锁式操作
          if (self.locks[table][key] != null)
          delete this.locks[table][key];
          self.invokeLockQueue(table, key);
      }
  }

  //从某个key对应的cache中获取想要获取的一组值
  self.getMongo(table, key, function (err, data){
      console.error(data)
      if (err) return cb(err);
      var values = {};
      var field;
      for (var i = 0, len = fields.length; i < len; i++) {
          field = fields[i];
          values[field] = self.getValue(data, field);　//可以为null
    }

    cb(null, values);
  });
};

pro.set = function (table, key, groupID, ingoreLock, lock, fieldValues, cb) {
　//　fieldValues :　{　'Level':data.Level, 'Gold':data.Gold　}　
  var self = this;

  if (!ingoreLock) {
    if (this.locks[table][key] != null) {
      var lockGroupID = this.locks[table][key].groupID;
      // 无效死锁
      if (groupID < lockGroupID) {
        cb('无效死锁');
        return;
      }

      if (groupID > lockGroupID) {
        this.pushLockQueue(table, key, groupID, 'set', fieldValues, lock, cb);
        return;
      }
    }

    if (lock) {
      self.locks[table][key] = {
        time: (new Date()).getTime(),
        groupID: groupID
      }
    }
    else {
      if (self.locks[table][key] != null)
          delete this.locks[table][key];
      self.invokeLockQueue(table, key);
    }
  }

  self.setValue(table, key, fieldValues, cb);
};

pro.unlock = function (table, key, groupID, cb) {
  if (cb != null) cb();

  var lockData = this.locks[table][key];
  if (lockData == null) return;

  if (lockData.groupID != groupID) return;

  delete this.locks[table][key];

  this.invokeLockQueue(table, key);
};
