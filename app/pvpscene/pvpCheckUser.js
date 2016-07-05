
module.exports = function (app, connection, proto, session, next) {
    if (session == null || session.key == null) {
        app.log.err('pvpCheckUser没有session没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    next(null, null, null, app.room.checkUser(session.key) ? '1' : '0');
};