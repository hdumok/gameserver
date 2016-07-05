
module.exports = function (app, connection, proto, session) {
    if (session == null || app.isNullOrEmpty(session.key)) {
        app.log.err('PVPLockStepCmd没有session没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    var key = session.key;

    var data = proto.getData();
    var success = app.room.process(key, data.ID, data.Data);

    if (success) {
        app.room.check(key, function (error, users, id, ops) {
            if (error) return app.boardcast.response(key, app.config.BoardcastType.PVPLockStep, error);

            app.boardcast.response(users, app.config.BoardcastType.PVPLockStep, null, {'Data': [{'ID':id,'Data':ops}]}, 'InputFramesData');
        });
    }
    else {
        app.room.checkLost(key, data.ID, function (error, users, data) {
            if (error) return app.boardcast.response(key, app.config.BoardcastType.PVPLockStep, error);

            app.boardcast.response(users, app.config.BoardcastType.PVPLockStep, null, {'Data': data}, 'InputFramesData');
        });
    }
};