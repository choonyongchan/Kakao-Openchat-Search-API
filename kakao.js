//© 2020 KeonWoo PARK <parkkw472@gmail.com>
var request = require("request");
var ip = require('ip');
var fetch = require('node-fetch');
require('date-utils');

function room_search_list(query, type, count, list) {
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

function room_search(name){
  return new Promise((rsv, rej) =>{
    var temp = "https://open.kakao.com/c/search/unified?q=" + name + "&resultType=m&s=l&c=30&exceptLock=N&p=1"
    var uri_s = encodeURI(temp);
    fetch(uri_s).then((re) =>{
      re.json().then((res) =>{
        res.count == 0 ? rsv({"success": "false", "reason": "cant find room name"}) : undefined
        for (var i = 0; i < res.count; i++) { //검색된 리스트중 방 검색
            if (res.items[i].ln == name || res.items[i].lu == name ) {
              var r_e = {
                "success": "true",
                "result": {
                  "name": res.items[i].ln,
                  "link": res.items[i].lu,
                  "description": res.items[i].desc,
                  "headcount": res.items[i].mcnt,
                  "master": res.items[i].nn,
                  "tags": res.items[i].tags,
                  "like": res.items[i].rc
                }
                ,"Node": ip.address()
              }
            rsv(r_e);
          }
        }
        rsv({"success": "false", "reason": "can\'t find room name"});
      }).catch((err) =>{
        rsv({"success": false, "reason": "Error Occurred." + err });
        console.log(err)
      });
    }).catch((err) =>{
      rsv({"success": false, "reason": "Error Occurred while Querying Kakaotalk Server." + err });
      console.log(err)
    });
  });
}
module.exports.room_search_list = room_search_list;
module.exports.room_search = room_search;
