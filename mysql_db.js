var mysql = require('mysql');
require('date-utils');
var connection = mysql.createConnection({
    host: 'localhost',    // 호스트 주소
    user: 'username',           // mysql user
    password: 'nicepassword',       // mysql password
    database: 'urdatabase',         // mysql 데이터베이스
    charset: 'utf8mb4'
}); 
connection.connect();
connection.query("SET NAMES utf8mb4;")
function logging(ip, user, room, room_result, success, reason, node_ip) {
    var sql = 'INSERT INTO `LOG` (`IP`, `USER-AGENT`, `ROOM_NAME`, `ROOM_NAME_RESULT`, `SUCCESS`, `REASON`, `NODE_IP`, `TIME`) VALUES (?,?,?,?,?,?,?, CURRENT_TIMESTAMP)'
    var param = [ip, user, room, room_result, success, reason, node_ip];
    console.log(param);
    connection.query(sql, param, (error, results, fields) => {
            if (error) {
                var date = new Date();
                var time = date.toFormat('YYYY-MM-DD HH24:MI:SS');
                console.log("[" + time + "]" + "Error occurred while DB LOGGING\n"+error);
            }
        });
}
function logging_search(param) {
    var sql = 'INSERT INTO `LOG_SEARCH` (`IP`,`USER-AGENT`,`QUERY`,`TYPE`,`COUNT`,`PAGE`,`SUCCESS`,`REASON`,`NODE_IP`) VALUES (?,?,?,?,?,?,?,?,?)'
    connection.query(sql, param, (err, results, fields) => {
        if (err) {
            var date = new Date();
            var time = date.toFormat('YYYY-MM-DD HH24:MI:SS');
            console.log("[" + time + "]" + "Error occurred while SEARCH DB LOGGING"\n" +  error);
        }
    });
}

module.exports.logging = logging;
module.exports.logging_search = logging_search;