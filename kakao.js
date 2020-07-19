var request = require("request");
var ip = require('ip');
require('date-utils');
var res1, res2, body1

function room_search(query, type, count, list) {
    return new Promise((resolve, reject) => {
        function callback(error, response, body) {
            if (error) {
                resolve({ "success": false, "reason": "error occurred while querying to kakao server" });
            }
            else {
                var a = JSON.parse(body);
                if (a.count == "0") {
                    resolve({ "success": true, "result": { "page": a.page, "count": a.count, "totalcount": a.totalCount, "lists": [] } });
                }
                else {
                    var w = new Array();
                    for (var g = 0; g < a.count; g++) {
                        var date = new Date(a.items[g].writtenAt*1000);
                        var time = date.toFormat('YYYY-MM-DD HH24:MI:SS');
                        var b = {
                            "name": a.items[g].ln,
                            "owner": a.items[g].nn,
                            "openlink": a.items[g].lu,
                            "desc": a.items[g].desc,
                            "tags": a.items[g].tags,
                            "like": a.items[g].rc,
                            "headcount": a.items[g].mcnt,
                            "locked": a.items[g].lk,
                            "lastchat": time,
                            "wp": a.items[g].liu,
                            "pfimg": a.items[g].pi
                        };
                        w.push(b);
                    }
                    resolve({"success": true, "result": { "page": a.page, "count": a.count, "totalcount": a.totalCount, "lists": w }, "Node":ip.address()});
                }
            }
        }
        var t = encodeURI("https://open.kakao.com/c/search/unified?q=" + query + "&resultType=" + type + "&s=l&c=" + count + "&exceptLock=N&p=" + list)
        request({
            uri: t,
            method: "GET",
            timeout: 10000
        }, callback);
    });
}

function room_s(name) {
    return new Promise(function (resolve, reject) {
        var temp = "https://open.kakao.com/c/search/unified?q=" + name + "&resultType=m&s=l&c=30&exceptLock=N&p=1"
        var uri_s = encodeURI(temp);
        request({
            uri: uri_s,
            method: "GET",
            timeout: 10000,
        },
            function (error, res, body) {
                if (error) {
                    error1 = error
                    resolve(error1);
                }
                else {
                    error1 = error
                    res2 = res
                    res1 = JSON.parse(res.body);
                    resolve(res1);
                }
            });
    });
}
function room_r(name) {
    return new Promise(function (resolve, reject) {
        
        if (error1) { //카카오톡으로부터 잘못된 응답이 왔을때
            var date = new Date();
            var time = date.toFormat('YYYY-MM-DD HH24:MI:SS');
            console.log("[" + time + "]" + "Error occurred while Querying KakaoTalk Open Chat");
            var r_e = {
                "success": False,
                "reason": "Error Occurred." + error1 
            }
            resolve(r_e);
        }
        else if (!error1) { //정상 응답이 왔을때;
            if (res1.count == "0") { //검색 결과가 없는 경우
                var r_e = {
                    "success": False,
                    "reason": "cant find room name"
                }
                resolve(r_e);
            }
            var t = 0
            if (name.indexOf("https://open.kakao.com/o/") != -1) {
                var r_e = {
                    "success": true,
                    "result": {
                        "name": res1.items[0].ln,
                        "link": res1.items[0].lu,
                        "description": res1.items[0].desc,
                        "headcount": res1.items[0].mcnt,
                        "master": res1.items[0].nn,
                        "tags": res1.items[0].tags,
                        "like": res1.items[0].rc
                    }
                    ,"Node": ip.address()
                }
                resolve(r_e);
                t = 1;
            }
            for (var i = 0; i < res1.count; i++) { //검색된 리스트중 방 검색
                if (res1.items[i].ln == name) {
                    var r_e = {
                        "success": true,
                        "result": {
                            "name": name,
                            "link": res1.items[i].lu,
                            "description": res1.items[i].desc,
                            "headcount": res1.items[i].mcnt,
                            "master": res1.items[i].nn,
                            "tags": res1.items[i].tags,
                            "like": res1.items[i].rc
                        }
                        ,"Node": ip.address()
                    }
                    
                    resolve(r_e);
                    t = 1
                }
            }
            /*검색 결과는 있으나 찾으려는 방이 없을경우*/
            if (t == 0) {
                var r_e = {
                    "success": False,
                    "reason": "can\'t find room name"
                }
                resolve(r_e);
            }
        }
    });
}
async function room(name) {
    var error1;
    return new Promise(async function (resolve, reject) {
        var r1 = await room_s(name)
        var r2 = await room_r(name)
        resolve(r2);
    });
}
module.exports.room_search = room;
module.exports.room_search_s = room_search;