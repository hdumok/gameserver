
module.exports = function (app, connection, proto, session, next) {
    if (session == null || app.isNullOrEmpty(session.key)) {
        app.log.err('PVPMatchCancelCmd没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    var key = session.key;

    app.match.cancel(key, function(err, data) {
        if (err) return app.log.err('取消匹配异常: ' + err);
        // 进入匹配
        if (data == 0)
            app.invoke(next, null, null, {}); //具体怎么定义回复客户端格式再说
        else
            app.invoke(next, null, null, {});
    });
};