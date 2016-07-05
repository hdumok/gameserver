
module.exports = function (app, connection, proto, session) {
    if (session == null || app.isNullOrEmpty(session.key)) {
        next('PVPFinishCmd没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    app.room.finish(session.key);
};