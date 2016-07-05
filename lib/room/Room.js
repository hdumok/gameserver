
module.exports = function (app)
{
    return new Room(app);
};

// TODO: 删除房间，删除对应玩家的sceneID
var Room = function (app)
{
    this.app = app;
    app.room = this;

    this.playerNum = app.config.PVPPlayerNum;
    this.rooms = [];
    this.users = {};

    this.app.dispatch.reset();
};

var pro = Room.prototype;

// 客户端第N帧输入
// == 服务器/客户端第N+1帧输出消息
// == record的长度N
// == record的下标N-1

// 客户端起始第1帧 == 服务器起始第2帧
pro.build = function (users, next) {
    var room = {};
    // 用户信息
    room.users = {};
    // 记录
    room.record = [];
    // 最后一次使用room的时间（用于两个人都断线删除房间）
    room.lastTime = (new Date()).getTime();
    // 战斗种子
    room.seed = Math.round(Math.random() * 999999);

    for (var i = 0; i < this.playerNum; i++) {
        var user = users[i];

        var key = user.Key;
        this.users[key] = room;
        room.users[key] = {
            'frame': 0,
            'finish': false,
            'items': user.Items,
        };

        this.app.redis.hset('session:' + key, 'pvpsceneID', this.app.local.id);
    }

    this.app.dispatch.add();
    console.log('创建房间: ' + this.app.coder.objToJSON(users));
    this.rooms.push(room);
    next();
};

pro.checkUser = function (key) {
    var room = this.users[key];
    if (room == null) {
        delete this.users[key];
        return false;
    }

    var now = (new Date()).getTime();
    if (now - room.lastTime >= this.app.config.PVPLostTime) {
        this.delRoom(room);
        return false;
    }

    return true;
};

pro.finish = function(key) {
    var room = this.users[key];
    if (room == null) {
        this.app.redis.hdel('session:' + key, 'sceneID');
        return cb('room finish 用户没有分配房间');
    }

    this.app.redis.hdel('session:' + key, 'sceneID');

    room.users[key].finish = true;

    for (var key in room.users) {
        if (room.users[key].finish) continue;
        return;
    }

    this.delRoom(room);
};

pro.getPVPInfoData = function (key, cb) {
    var room = this.users[key];
    if (room == null) {
        this.app.redis.hdel('session:' + key, 'sceneID');
        return cb('room getPVPInfoData 用户没有分配房间');
    }

    // 单人模式测试代码（重进清空之前的op）
    if (this.playerNum == 1) {
        room.users[key].frame = 0;
        room.record = [];
    }

    var users = [];
    for (var key in room.users) {
        users.push({
            'Key': key,
            'Items': room.users[key].items,
        });
    }

    cb(null, {'Users': users, 'Seed': room.seed});
};

pro.process = function (key, id, ops) {
    var room = this.users[key];

    if (room.users[key] == id) {
        console.log('重复操作。 key:' + key + ' id:' + id + ' ops:' + JSON.stringify(ops));
        return false;
    }

    var length = room.record.length;

    if (length == id - 1) {
        room.record.push(ops);
        room.lastTime = (new Date()).getTime();
        room.users[key].frame = id;
    }
    else if (length == id) {
        Array.prototype.push.apply(room.record[id - 1], ops)
        //room.record[id - 1] = room.record[id - 1].concat(ops);
        room.users[key].frame = id;
    }
    else {
        console.log('失效操作。 key:' + key + ' 用户服务器里的客户端帧数: ' + room.users[key] + ' 用户客户端里的帧数:' + id + ' ops:' + JSON.stringify(ops));
        return false;
    }

    return true;
};

pro.check = function (key, cb) {
    var room = this.users[key];
    if (room == null) {
        this.app.redis.hdel('session:' + key, 'sceneID');
        return cb('room check 用户没有分配房间');
    }

    var users = room.users;
    var to = [];
    var length = room.record.length;
    for (var key in users) {
        if (users[key].frame == -1) continue;
        if (users[key].frame != length) return;
        to.push(key);
    }

    cb(null, to, length + 1, room.record[length - 1]);
};

pro.checkDelay = function (key, cb) {
    var room = this.users[key];
    if (room == null) {
        this.app.redis.hdel('session:' + key, 'sceneID');
        return cb('room checkDelay 用户没有分配房间');
    }

    var now = (new Date()).getTime();
    if (room.lastTime != null && now - room.lastTime >= this.app.config.PVPDelayTime) {
        var length = room.record.length;
        room.lastTime = null;
        var users = room.users;

        var to = [];
        for (var key in users) {
            if (users[key].frame != length) {
                users[key].frame = -1;
                continue;
            }
            to.push(key);
        }

        cb(null, to, length + 1, room.record[length - 1]);
    }
};

pro.checkLost = function (key, id, cb) {
    var room = this.users[key];
    if (room == null) {
        this.app.redis.hdel('session:' + key, 'sceneID');
        return cb('room checkLost 用户没有分配房间');
    }

    var length = room.record.length -1;
    var data = [];
    for (var i = id - 1; i < length; i++) {
        data.push({
            'ID':i + 2,
            'Data':room.record[i]
        });
    }
    room.users[key].frame = length;
    cb(null, key, data);
};

pro.delRoom = function (room) {
    for (var key in room.users) {
        this.app.redis.hset('session:' + key, 'pvpsceneID', '');
        if (this.users[key] != null)
            delete this.users[key];
    }

    var index = this.rooms.indexOf(room);
    if (index == -1) {
        this.app.log.err('room delRoom。删除房间，但是房间不存在: ' + this.app.coder.objToJSON(room.users));
        return;
    }
    this.rooms.splice(index, 1);
    this.app.dispatch.sub();
    console.log('room delRoom。删除房间: ' + this.app.coder.objToJSON(room.users));
};

