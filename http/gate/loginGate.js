module.exports = function (app, req, res, urldata, bodydata){
    app.dispatch.get('sessionMin', 'connector', function(err, url) {
        if (err) {
            console.error(err);
            res.statusCode = 404;
            res.end();
        }

        res.write(url);
        res.end();
    });
}
