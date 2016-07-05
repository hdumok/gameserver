
module.exports = function (app, connection, proto, session, next) {
    if (connection.session == null) {
        app.invoke(next, '下线失败。没有session。');
        return;
    }

    // 从connector移除
    app.connector.unLogin(connection.session.key, connection, (session == null) ? false : session.crowd);

    app.invoke(next);
};