
module.exports = function (app, connection, proto, session, next) {
    if (session == null || session.key == null) {
        app.log.err('battleFull没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    var key = session.key;

    app.cache.pipeline(key, next,
        function (next) {
            app.cache.get(key, ['Battle'], function (err, data) {
                if (err != null) return next(err);

                var battle = data['Battle'];
                var info = battle.Infos[battle.Group].Info;

                if (info.length < 8) next('上阵人数不足。');
                else next();
            });
        });
};