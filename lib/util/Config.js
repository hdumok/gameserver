
module.exports = function (app) {
    return new Config(app);
};

// TODO: 可以传进来一个debug参数来读取不同路径下的配置文件
var Config = function (app) {
    var fs = require('fs');

    app.config = JSON.parse(fs.readFileSync('config/config.json', "utf8"));
    var startMode = (app.config.DebugMode) ? 'Debug':'Release';
    console.log(startMode+'模式服务器启动。。。');

    for(var config in app.config){
        if(app.config[config][startMode] != null){
            app.config[config] = app.config[config][startMode];
        }
    }
    console.log('加载'+ startMode + '模式全局配置完成');
};