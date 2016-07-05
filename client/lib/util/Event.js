var util = require('util');
var events = require('events');

module.exports = function (app, cb) {
    app.event = new Event(app)
    app.invoke(cb)
};

var Event = function (app) {
    this.app = app;
    console.log('加载全局事件完成');
};
util.inherits(Event, events.EventEmitter);

