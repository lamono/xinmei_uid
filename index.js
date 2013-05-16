/**
 * Created with JetBrains WebStorm.
 * User: Baoxu Shi
 * Date: 13-5-16
 * Time: PM3:24
 * To change this template use File | Settings | File Templates.
 */

var http = require('http');
var connection = require('./lib/connection_pool.js');
var conf = require('./conf.js');

var INSERT_MYSQL = 'INSERT INTO '+conf.table+' (user_id,serv_id) VALUES (NULL,?);'

http.createServer(function(request, response){

    var serv = request.url.split('/');
    connection(INSERT_MYSQL, [serv[serv.length-1]], response, null, function(err, res, next, result){
        if(err||!result.insertId){
            response.writeHead(200, {"Content-Type":"text/plain"});
            response.write(JSON.stringify({'err':'error'}));
            response.end();
        }else{
            response.writeHead(200, {"Content-Type":"text/plain"});
            response.write(JSON.stringify({'err':'ok','user_id':result.insertId}));
            response.end();
        }
    });

}).listen(conf.port);
