
module.exports = function (app, connection, proto, session, next) {
    if (session == null || session.users == null) {
        app.log.err('pvpBuildRoom没有session没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    var users = session.users;
    var data = [];

    var getBattleInfo = function () {
        if (users.length == 0) {
            app.room.build(data, next);
            return;
        }

        var key = users[0];
        users.splice(0, 1);

        app.rpc.battleInfo({'key':key}, null, null, {'key':key}, function (response) {
            if (!app.isNullOrEmpty(response.Error)) return next(response.Error);

            data.push(response.getData());
            getBattleInfo();
        })
    };
    getBattleInfo();
};