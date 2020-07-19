var express = require('express');
var app = express();
var db = require("./mysql_db");
var kakao = require("./kakao");
var ip = require('ip');
String.prototype.replaceAll = function (org, dest) {
    return this.split(org).join(dest);
}
var server = app.listen(1337, function () {
    console.log("API server has started on port 1337")
})
app.get('/', function (req, res) {
    var ips = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    ips = ips.replace(/^.*:/, '');
    res.json({ "success": true, "result": "Hello,There!", "User-Agent": req.headers['user-agent'], "Node": ip.address() });
});
app.get('/search/room', async function (req, res) {
    if (req.param("room") == undefined ||  req.param("room") == "") {
        var ips = req.headers['x-forwarded-for'][0] || req.connection.remoteAddress;
        res.json({ "success": false, "reason": "room param missing", "Node": ip.address() });
        db.logging(ips, req.headers['user-agent'].replaceAll("'", "\\'"), "None", " ", false, "room param missing", ip.address());
        return;
    }
    var result = await kakao.room_search(req.param("room"));
    function and() {
        return new Promise(function (resolve, reject) {
            if (result["success"] == false) {
                var ips = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                res.json({ "success": false, "reason": result['reason'], "Node": ip.address() });
                db.logging(ips, req.headers['user-agent'].replaceAll("'", "\\'"), req.param("room").replaceAll("'", "\\'"), " ", false, result['reason'], ip.address());
                resolve();
            }

            else if (result["success"] == true) {
                var ips = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                res.json(result);
                db.logging(ips, req.headers['user-agent'].replaceAll("'", "\\'"), req.param("room").replaceAll("'", "\\'"),result["result"]["name"], true, " ", ip.address());
                resolve();
            }
        });
    }
    var a = await and();
});

app.get('/search/room/list', async function (req, res) {
    var ips = req.connection.remoteAddress;
    if (req.param("query") == undefined || req.param("type") == undefined) {
        res.json({ "success": false, "reason": "params missing", "Node": ip.address() });
        db.logging_search([ips, req.headers['user-agent'].replaceAll("'", "\\'"), "", "", req.param("count") || 30, req.param("page") || 1, false, "params missing", ip.address()])
        return;
    }
    else if (req.param("type") != "m" && req.param("type") != "p") {
        res.json({ "success": false, "reason": "Unsupported type value", "Node": ip.address() });
        db.logging_search([ips, req.headers['user-agent'].replaceAll("'", "\\'"), req.param("query"), req.param("type"), req.param("count") || 30, req.param("page") || 1, false, "Unsupported type", ip.address()])
        return;
    }
    else if (req.param("count")>100 || req.param("count")<1) {
        res.json({ "success": false, "reason": "Invalid count value", "Node": ip.address() });
        db.logging_search([ips, req.headers['user-agent'].replaceAll("'", "\\'"), req.param("query"), req.param("type"), "", req.param("page") || 1, false, "Invalid count value", ip.address()])
        return;
    }
    else if (req.param("page") < 1 || req.param("page") > 10000) {
        res.json({ "success": false, "reason": "Invalid page value", "Node": ip.address() });
        db.logging_search([ips, req.headers['user-agent'].replaceAll("'", "\\'"), req.param("query"), req.param("type"), req.param("count") || 30, "", false, "Invalid page value", ip.address()])
        return;
    }
    else {
        var result = await kakao.room_search_s(req.param("query"), req.param("type"), req.param("count") || 30, req.param("page") || 1);
        res.json(result);
        db.logging_search([ips, req.headers['user-agent'].replaceAll("'", "\\'"), req.param("query"), req.param("type"), req.param("count") || 30, req.param("page") || 1, true, "", ip.address()])
        return;
    }
});