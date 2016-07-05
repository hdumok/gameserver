
module.exports = function (app, connection, proto, session) {
    if (session == null || app.isNullOrEmpty(session.key)) {
        app.log.err('PVPMatchCmd没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    var key = session.key;

    var match = function() {
        app.match.check(key, function(err, users) {
            if (err) return app.log.err('匹配失败: ' + err);
            // 进入匹配
            if (users == null) return console.log("人员未满 正在匹配: " + key);

            // 匹配成功，建立房间
            app.dispatch.get(null, 'pvpscene', function (err, config){
                if (err) return app.log.err(err);
                if (config == null) return app.log.err('服务器已满');
                var url = config.host + ':' + config.port;

                app.rpc.pvpBuildRoom(url, null, null, {'users':users});

                app.boardcast.response(users, app.config.BoardcastType.PVPMatch, null, null, null, url);
            });
        });
    };

    app.redis.hget('session:' + key, 'sceneID', function(err, sceneID) {
        if (err) return app.log.err(err);

        // 进行匹配
        if (sceneID == null)
            return match();

        // 已经存在服务器
        var url = app.getRPCURL(sceneID);

        if (url == null)
            return match();

        app.rpc.pvpCheckUser(url, null, null, {'key': key}, function (response) {
            if (!app.isNullOrEmpty(response.Error)) return match();
            if (response.Msg == '0') return match();
            app.boardcast.response(key, app.config.BoardcastType.PVPMatch, null, null, null, url);
        });
    });
};