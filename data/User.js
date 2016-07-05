
var Data = require('./../lib/data/Data');

module.exports = function (app)
{
    return new User(app);
};

var User = function (app)
{
    this.app = app;
    app.user = this;
};

var pro = User.prototype;

pro.get = function (key, fields, cb) {
    Data.get(this.app, 'user', key, fields, cb);
};

pro.getIngoreLock = function (key, fields, cb) {
    Data.getIngoreLock(this.app, 'user', key, fields, cb);
};

pro.set = function (key, fields, handle, cb) {
    Data.set(this.app, 'user', key, fields, handle, cb);
};