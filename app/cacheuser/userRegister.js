
module.exports = function (app, connection, proto, session, next) {
    if (session == null || session.key == null) {
        app.log.err('cacheRegister没有session没有正确的Session。 session:' + JSON.stringify(session));
        return;
    }

    var key = session.key;

    app.cache.register(key, function (err, data) {
        if (err) return next(err);

        if (data.LastLogin == null) {
            app.cache.pipeline(key, next,
                function (next) {
                data = GetInitData(app, key);
                app.cache.set(key, data, function (err) {
                    if (err != null) return next(err);
                    next(null, {'Key': data.Key, 'Package': data.Package, 'Attrib': data.Attrib, 'Battle': data.Battle}, 'PlayerData');
                })
            });

            return;
        }

        next(null, {'Key': data.Key, 'Package': data.Package, 'Attrib': data.Attrib, 'Battle': data.Battle}, 'PlayerData');
    });
};

function GetInitData (app, key) {
    var lastLogin = (new Date()).getTime();
    var items = {};
    var itemIndex = 0;
    items[++itemIndex] = {'Key':itemIndex, 'ID':20000001, 'Num':1};
    items[++itemIndex] = {'Key':itemIndex, 'ID':20000001, 'Num':1};
    items[++itemIndex] = {'Key':itemIndex, 'ID':20000001, 'Num':1};
    items[++itemIndex] = {'Key':itemIndex, 'ID':20000001, 'Num':1};
    items[++itemIndex] = {'Key':itemIndex, 'ID':20001001, 'Num':1};
    items[++itemIndex] = {'Key':itemIndex, 'ID':20001001, 'Num':1};
    items[++itemIndex] = {'Key':itemIndex, 'ID':20001001, 'Num':1};
    items[++itemIndex] = {'Key':itemIndex, 'ID':20001001, 'Num':1};

    return {
        'Key': key,
        'LastLogin': lastLogin,
        'Package': {
            'Index': itemIndex,
            'Items': items,
        },
        'Attrib': {
            'Level': 1,
            'Exp': 0,
        },
        'Battle': {
            'Group': 0,
            'Infos': [{
                'Info': [],
            },{
                'Info': [],
            },{
                'Info': [],
            },{
                'Info': [],
            }],
        },
    }
}