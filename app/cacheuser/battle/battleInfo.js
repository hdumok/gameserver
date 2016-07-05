
module.exports = function (app, connection, proto, session, next) {
    if (session == null || session.key == null) {
        app.log.err('battleInfo没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    var key = session.key;

    app.cache.pipeline(key, next,
        function (next) {
            app.cache.get(key, ['Battle', 'Package'], function (err, data) {
                if (err != null) return next(err);

                var package = data['Package'];
                var battle = data['Battle'];
                var info = battle.Infos[battle.Group].Info;

                if (info.length < 8) next('上阵人数不足。');

                var items = [];
                for (var i = 0; i < 8; i++)
                    items[i] = package.Items[info[i]];

                var userData = {
                    'Key': key,
                    'Items': items
                };

                next(null, userData, 'PVPUserData');
            });
        });
};