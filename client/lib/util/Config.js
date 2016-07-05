var fs = require('fs');

module.exports = function (app, cb) {
    app.config = JSON.parse(fs.readFileSync('../config/config.json', "utf8"));

    var startMode = (process.env.NODE_ENV === 'Release') ? 'Release':'Debug';
    for(var config in app.config){
        if(app.config[config][startMode] != null){
            app.config[config] = app.config[config][startMode];
        }
    }
    app.invoke(cb);
    console.log('加载'+ startMode + '模式全局配置完成');
};
