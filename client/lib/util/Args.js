
module.exports = function (app, cb) {
    var args = parseArgs(process.argv);
    if(args == null){
        console.error('未传入启动参数');
        return cb({});
    }

    app.invoke(cb, args);
    console.log('加载启动参数完成');
};

function parseArgs (args) {
  var argsMap = {};
  var mainPos = 1;

  while (args[mainPos].indexOf('--') > 0) {
    mainPos++;
  }
  argsMap.main = args[mainPos];

  for (var i = (mainPos + 1); i < args.length; i++) {
    var arg = args[i];
    var sep = arg.indexOf('=');
    var key = arg.slice(0, sep);
    var value = arg.slice(sep + 1);
    if (!isNaN(Number(value)) && (value.indexOf('.') < 0)) {
      value = Number(value);
    }
    argsMap[key] = value;
  }

  return argsMap;
};
