
var redis = require('ioredis');
client = new redis('8001', '127.0.0.1', { "password": "Nq0ptBGoF3" } );

var fs = require('fs');
var files = fs.readdirSync('./redislua');
for (var i = 0, len = files.length; i < len; i++) {
    var file = files[i];
    var context = fs.readFileSync('./redislua/' + file, 'utf-8');
    var firstLine = context.split('\r\n')[0];
    var info = JSON.parse(firstLine.substr(2));
    var lua = context.substr(firstLine.length + 2);

    client.defineCommand(info.nameOfCommand, {
        numberOfKeys: info.numberOfKeys,
        lua: lua
    });
}

client.defineCommand('hgetall', {
    numberOfKeys: 1,
    lua: 'return redis.call("hgetall", KEYS[1], unpack(ARGV));'
});

client.hgetall('hgetall', function(err, value){

    if (err) return console.log(err)
    console.log(value)
})

console.log('aa')
client.pvpMatch('a', 2, function (err, value){
    if (err) return console.log(err)
    console.log(value)
});
client.pvpMatch('b', 2, function (err, value){
    if (err) return console.log(err)
    console.log(value)
});