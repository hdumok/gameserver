
module.exports = function (app, connection, proto, session, next) {
    if (session == null || app.isNullOrEmpty(session.key)) {
        app.log.err('TestAddItemCmd没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    var key = session.key;

    var param = proto.getData();
    var id = param.ID;

    app.cache.pipeline(key, next,
        function (next) {
            app.cache.get(key, ['Package'], function (err, data) {
                if (err != null) return next(err);

                next(null, data['Package']);
            });
        },
        function (package, next) {
            var items = package.Items;

            var addNum = false;
            // TODO: 测试代码
//            for (var key in items) {
//                if (items[key].ID == id) {
//                    items[key].Num++;
//                    addNum = true;
//                    break;
//                }
//            }

            if (!addNum) {
                package.Index++;
                items[package.Index] = {
                    'Key': package.Index,
                    'ID': id,
                    'Num': 1,
                };
            }

            app.cache.set(key, {'Package': package}, function (err) {
                if (err != null) return next(err);
                next();
            });
        });
};