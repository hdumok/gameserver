
module.exports = function (app, connection, proto, session, next) {
    if (session == null || app.isNullOrEmpty(session.key)) {
        next('PVPEnterCmd没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    app.room.getPVPInfoData(session.key, function (err, data) {
        if (err) return next(err);

        console.log(' 进入战斗: ' + app.coder.objToJSON(data));
        next(null, data, 'PVPInfoData');
    });
};