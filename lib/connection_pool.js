/**
 * Created with JetBrains WebStorm.
 * User: bxshi
 * Date: 13-1-23
 * Time: AM10:45
 * To change this template use File | Settings | File Templates.
 */

var poolModule = require('generic-pool');
var logger = require('./logger.js')('database');
var config = require('../config.js').database;

var resourceTimeoutManager = require('./resourceTImeoutManager.js');

var pool = poolModule.Pool(
    {
        name : 'xinmei_uid-mysql.ConnectionPool',
        create : function(callback){
            var connection = require('mysql').createConnection(config);
            connection.on('close',function(err){
                logger.error('mysqldb conn close'+err);
                pool.destroy(connection);
            });

            var handleDisconnection = function(connection){
                connection.on('error', function (err) {
                    logger.error('mysqldb error: ' + err);
                    if(!err.fatal){
                        return;
                    }
                    if(err.code !== 'PROTOCOL_CONNECTION_LOST' && err.code != 'ECONNREFUSED'){
                        logger.error('mysqldb error code ', err.code);
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
        log : function(string,level){
            if( level != 'verbose'){
                logger[level](string);
            }
        },
        priorityRange : 10
    }
);

var rTM = new resourceTimeoutManager(pool, 10000, 'mysql');

doQuery = function(queryString, queryVariable, res, next, cb){

    pool.acquire(function(err, connection){

        if(err){
            logger.fatal('Resource pool error: '+err);
            cb(err, res, next, null);
        }else{

            try{
                if(typeof queryString != 'string' || typeof queryVariable != 'object'){
                    throw new Error('Must specify queryString and queryVariable');
                }
            }catch(e){
                logger.error(e);
            }
            logger.debug('queryString is '+queryString+'\n variables are '+JSON.stringify(queryVariable));

            var ruid = rTM.setResource(connection);

            var query = connection.query(queryString, queryVariable, function(error, result){
                //TODO finish refactor
                if(error){
                    logger.error('SQL expression '+this.sql+' execution error.\n'+error);
                    if(typeof cb == 'function'){
                        cb(error, res, next, null);
                        cb = null;
                        res = null;
                        next = null;
                    }
                }else{
                    logger.debug('SQL result is '+ JSON.stringify(result));
                    if(typeof cb == 'function'){
                        cb(null, res, next, result);
                        cb = null;
                        res = null;
                        next = null;
                    }else{
                        logger.warn('cb is not a function! The type of it is '+typeof cb);
                        logger.warn(cb);
                    }
                }

                pool.release(connection);
                rTM.delResource(ruid);

            });

            query.on('error', function(err){
                logger.debug('got mysql error');
                logger.error(err);
            });
            query.on('fields', function(fields, index){
                logger.debug('got fields');
            });
            query.on('result', function(row, index){
                logger.debug('got result');
            });

        }

    });

};

module.exports = doQuery;