var Later = require('later');

module.exports = function (app) {
    return new Timer(app);
};

var Timer = function (app) {
    app.setTimeout = this.setTimeout;
    app.setInterval = this.setInterval;
};

var pro = Timer.prototype;

pro.setTimeout = function (time, callback) {
    if (time == 0)
    {
        callback();
        return;
    }
    var s = Later.parse.text(time);
    return Later.setTimeout(callback, s);
};

pro.setInterval = function (time, callback) {
    if (time == 0)
    {
        callback();
        return;
    }
    var s = Later.parse.text(time);
    return Later.setInterval(callback, s);
};