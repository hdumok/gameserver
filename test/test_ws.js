
var WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({ port: 3445 });

var fs = require('fs');
var protobuf = require('protocol-buffers');
var message = protobuf(fs.readFileSync(__dirname + '/test.proto'));

wss.on('connection', function (ws) {
    console.log('connection');
    ws.on('message', function (buf) {
        console.log('received: %s', buf);

        var obj = message.MainData.decode(buf);


        console.log("TestEnum: " + obj.TestEnum);
        console.log("TestInt: " + obj.TestInt);
        console.log("TestFloat: " + obj.TestFloat);
        console.log("TestString: " + obj.TestString);
        console.log("TestChild: " + obj.TestChild.TestInt);
        console.log("TestListInt: " + obj.TestListInt[0]);
        console.log("TestListChild: " + obj.TestListChild[0]);
        console.log("TestDicIntString: " + obj.TestDicIntString[1]);
        console.log("TestDicStringInt: " + obj.TestDicStringInt["a"]);
        console.log("TestDicIntChild: " + obj.TestDicIntChild[1]);
        console.log("TestDicStringChild: " + obj.TestDicStringChild["a"]);
        console.log("TestBool: " + obj.TestBool);
    });

    ws.send('something');
});