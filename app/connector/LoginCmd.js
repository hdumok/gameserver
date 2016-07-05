
module.exports = function (app, connection, proto, session, next) {
    var data = proto.getData();
    var key = data.Key;
    var secret = data.Secret;

    app.connector.login(key, secret, connection, function (err) {
        if (err != null) return next(err);

        app.rpc.userRegister({'key':key}, null, null, {'key':key}, function(response) {
            next(response.Error, response.Data, response.Schema, response.Msg);
        });
    });
};