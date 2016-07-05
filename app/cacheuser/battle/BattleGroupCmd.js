
module.exports = function (app, connection, proto, session, next) {
    if (session == null || session.key == null) {
        return next('BattleGroupCmd不存在key');
    }

    var key = session.key;
    var param = proto.getData();
    if (param == null) {
        return next('BattleGroupCmd参数不存在');
    }

    var battleGroup = param.Group;
    if (battleGroup >= 4) return next('BattleGroupCmd失败，上阵组别超过上线。下标: ' + battleGroup);

    app.cache.pipeline(key, next,
    function (next) {
        app.cache.get(key, ['Battle'], function (err, data) {
            if (err != null) return next(err);

            next(null, data['Battle']);
        });
    },
    function (battle, next) {
        battle.Group = battleGroup;

        app.cache.set(key, {'Battle': battle}, function (err) {
            if (err != null) return next(err);
            next();
        });
    });
};