
module.exports = function (app, connection, proto, session, next) {
    if (session == null || session.key == null) {
        return next('BattleChangeCmd不存在key');
    }

    var key = session.key;
    var param = proto.getData();
    if (param == null) {
        return next('BattleChangeCmd参数不存在');
    }

    var battleGroup = param.Group;
    if (battleGroup >= 4) return next('BattleChangeCmd失败，上阵组别超过上线。下标: ' + battleGroup);

    var battleIndex = param.BattleIndex;
    // 检测index是否超过上阵上限
    if (battleIndex >= 8) return next('BattleChangeCmd失败，上阵人数超过上线。下标: ' + battleIndex);

    var heroKey = param.HeroKey;

    app.cache.pipeline(key, next,
    function (next) {
        app.cache.get(key, ['Battle', 'Package'], function (err, data) {
            if (err != null) return next(err);

            next(null, data['Battle'], data['Package']);
        });
    },
    function (battle, package, next) {
        battle.Group = battleGroup;

        if (package.Items[heroKey] == null)
            return next('BattleChangeCmd失败，英雄不存在包裹。玩家key:' + key + ' 英雄key:' + heroKey);

        var info = battle.Infos[battleGroup].Info;

        if (battleIndex < info.length)
            info[battleIndex] = heroKey;
        else
            info.push(heroKey);

        app.cache.set(key, {'Battle': battle}, function (err) {
            if (err != null) return next(err);
            next();
        });
    });
};