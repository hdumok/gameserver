
module.exports = function (app, connection, data, session, next) {
    if (session == null || app.isNullOrEmpty(session.Key)) {
        app.log.err('PVPMatchCancleCmd没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }
console.debug('取消匹配')
    console.debug(session)
    var key = session.Key;

    app.match.cancel(key);
    app.invoke(next);
};