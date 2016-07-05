var Coder = require('./lib/util/Coder');
var Log = require('./lib/util/Log');
var Config = require('./lib/util/Config');
var Loader = require('./lib/util/Loader');
var Util = require('./lib/util/Util');
var Args = require('./lib/util/Args');
var Event = require('./lib/util/Event');
var RPC = require('./lib/rpc/RPC');

process.on('uncaughtException', function(err) {
        console.error("uncaughtException: \n" + err.stack);
    }
);

var app = {};


app.serverType = "user";
app.id = "user_1";
app.host = '127.0.0.1';
app.port = 9001;

Log(app);
Util(app);
Args(app);
Config(app);
Event(app);
Coder(app);
Loader(app);
RPC(app, 0);
app.rpcClients[0].requestCallbacks[1] = function(error, data, schema, msg){
    if(error) console.error("1号回调 " + JSON.stringify(error));
    else {
        console.log("1号回调data " + JSON.stringify(data));
        console.log("1号回调schema " + JSON.stringify(schema));
        console.log("1号回调msg " + JSON.stringify(msg));
    }
}
app.rpcClients[0].requestCallbacks[2] = function(error, data, schema, msg){
    if(error) console.error("2号回调 " + JSON.stringify(error));
    else {
        console.log("2号回调data " + JSON.stringify(data));
        console.log("2号回调schema " + JSON.stringify(schema));
        console.log("2号回调msg " + JSON.stringify(msg));
    }
}
setTimeout(function(){
    app.rpc.LoginCmd(null, {Key:'2'}, 'LoginCmd', null, function(){
        console.debug(arguments)
    })
}, 2000);

setTimeout(function(){
    app.rpc.PVPMatchCmd(null, null ,null, null, function(err, data){
        if(err) console.error("PVPMatchCmd " + JSON.stringify(err));
        else console.log("PVPMatchCmd " + JSON.stringify(data));
    })
}, 6000);

setTimeout(function(){
    var i = 2;
    setInterval(function(){
        app.rpc.PVPLockStepCmd(null ,{ID:i++, Data:{ID:1}}, 'PVPLockStepCmd', null, function(err, data){
            if(err) console.error("PVPLockStepCmd " + JSON.stringify(err));
            else console.log("PVPLockStepCmd " + JSON.stringify(data));
        })
    }, 1000)
}, 12000);