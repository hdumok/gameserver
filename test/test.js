var async = require('async');

async.parallel([function(cb) {
        cb(null,'a')
    },
    function(cb) {
        cb('error1')
    },
    function(cb) {
        cb(null,'c')
    }],


    function(err, results) {
console.log(arguments)
    }
);
var a = {
    a:2
}

console.log(JSON.stringify(a))