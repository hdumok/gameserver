
var fs = require('fs');
var protobuf = require('protocol-buffers');
var message = protobuf(fs.readFileSync(__dirname + '/test.proto'));

var childData = {};
childData.TestInt = 2;
childData.TestFloat = 2.2;
childData.TestString = 'def';

var mainData = {};
mainData.TestInt = 1;
mainData.TestFloat = 1.1;
mainData.TestString = 'abc';
mainData.TestChild = childData;
mainData.TestListInt = [1, 2, 3];
mainData.TestListChild = [childData];
mainData.TestDicIntString ={  1: "a" ,  2: "b"  };
mainData.TestDicStringInt = {  "a": 1 ,  "b": 2  };
mainData.TestDicIntChild = {  1: childData  };
mainData.TestDicStringChild = {  "a": childData  };

var buf = message.MainData.encode(mainData);
var str = '';
for (var i = 0, len = buf.length; i < len; i++) str += buf[i];
console.log(str);
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