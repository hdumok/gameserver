
// TODO: 可以利用ngix负载
module.exports = function (app, connection, proto, session, next) {
    app.dispatch.get(null, 'connector', function(err, url) {
        if (err) return next(err);
        next(null, null, null, url);
    });
};