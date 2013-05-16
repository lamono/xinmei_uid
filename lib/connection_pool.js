/**
 * Created with JetBrains WebStorm.
 * User: bxshi
 * Date: 13-1-23
 * Time: AM10:45
 * To change this template use File | Settings | File Templates.
 */

var poolModule = require('generic-pool');
var config = require('../conf.js').database;

var resourceTimeoutManager = require('./resourceTImeoutManager.js');

var pool = poolModule.Pool(
    {
        name : 'solidsundae-mysql.ConnectionPool',
        create : function(callback){
            var connection = require('mysql').createConnection(config);
            connection.on('close',function(err){
                console.log('mysqldb conn close'+err);
                pool.destroy(connection);
            });

            var handleDisconnection = function(connection){
                connection.on('error', function (err) {
                    console.log('mysqldb error: ' + err);
                    if(!err.fatal){
                        return;
                    }
                    if(err.code !== 'PROTOCOL_CONNECTION_LOST' && err.code != 'ECONNREFUSED'){
                        console.log('mysqldb error code ', err.code);
                        return;
                    }
                    try{
                        pool.destroy(connection);
                    }catch(err){

                    }
                });
            };

            handleDisconnection(connection);

            callback(null, connection);
        },
        destroy : function(connection){
            connection.destroy();
        },
        max : 50,
        min : 5,
        idleTimeoutMillis : 60000,
        reapIntervalMillis : 10000,
        priorityRange : 10
    }
);

var rTM = new resourceTimeoutManager(pool, 10000, 'mysql');

doQuery = function(queryString, queryVariable, res, next, cb){

    pool.acquire(function(err, connection){

        if(err){
            console.log('Resource pool error: '+err);
            cb(err, res, next, null);
        }else{

            try{
                if(typeof queryString != 'string' || typeof queryVariable != 'object'){
                    throw new Error('Must specify queryString and queryVariable');
                }
            }catch(e){
                console.log(e);
            }
            console.log('queryString is '+queryString+'\n variables are '+JSON.stringify(queryVariable));

            var ruid = rTM.setResource(connection);

            var query = connection.query(queryString, queryVariable, function(error, result){
                //TODO finish refactor
                if(error){
                    console.log('SQL expression '+this.sql+' execution error.\n'+error);
                    if(typeof cb == 'function'){
                        cb(error, res, next, null);
                        cb = null;
                        res = null;
                        next = null;
                    }
                }else{
                    console.log('SQL result is '+ JSON.stringify(result));
                    if(typeof cb == 'function'){
                        cb(null, res, next, result);
                        cb = null;
                        res = null;
                        next = null;
                    }else{
                        console.log('cb is not a function! The type of it is '+typeof cb);
                        console.log(cb);
                    }
                }

                pool.release(connection);
                rTM.delResource(ruid);

            });

            query.on('error', function(err){
                console.log('got mysql error');
                console.log(err);
            });
            query.on('fields', function(fields, index){
                console.log('got fields');
            });
            query.on('result', function(row, index){
                console.log('got result');
            });

        }

    });

};

module.exports = doQuery;