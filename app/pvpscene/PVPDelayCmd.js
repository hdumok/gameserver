
module.exports = function (app, connection, proto, session) {
    if (session == null || app.isNullOrEmpty(session.key)) {
        app.log.err('PVPDelayCmd没有session没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    var key = session.key;

    app.room.checkDelay(key, function (error, users, id, ops) {
        if (error) return app.boardcast.response(key, app.config.BoardcastType.PVPLockStep, error);

        app.boardcast.response(users, app.config.BoardcastType.PVPLockStep, null, {'Data': [{'ID':id,'Data':ops}]}, 'InputFramesData');
    });
};