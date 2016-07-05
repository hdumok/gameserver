var a = {
    b:{c:'c'},
    e:1,
    c:new Buffer(4)
}
var json = JSON.stringify(a)
console.log(json);
var json2 = JSON.parse(json, function (key, value) {
    return value && value.type === 'Buffer'
        ? new Buffer(value.data)
        : value;
});
console.log(typeof 'json2')
