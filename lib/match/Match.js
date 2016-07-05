
module.exports = function (app)
{
    return new Match(app);
};

var Match = function (app) {
    this.app = app;
    this.playerNum = app.config.PVPPlayerNum;

    app.match = this;
};

var pro = Match.prototype;

pro.check = function (key, cb) {
    var self = this;
    this.app.redis.pvpMatch(key, this.playerNum, function(err, data){
        if (err) {
            self.app.log.err(err);
            return cb(err);
        }

        if (data == 0) return cb();
        cb(null, data);
    });
};

pro.cancel = function (key, cb) {
    var self = this;
    this.app.redis.hdel('match', key, function(err, data){
        if (err) {
            self.app.log.err(err);
            return cb(err);
        }

        if (data == 0) return cb();
        // TODO: 取消成功再log
        console.log('取消匹配。 Key: ' + key);
        cb(null, data);
    });
};