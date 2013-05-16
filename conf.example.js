/**
 * Created with JetBrains WebStorm.
 * User: Baoxu Shi
 * Date: 13-5-16
 * Time: PM3:26
 * To change this template use File | Settings | File Templates.
 */
module.exports = {
    'port' : 62371, //port to start this service
    'database' : {
        'host' : '192.168.2.202',
        'user' : 'shibaoxu',
        'password' : 'baoxu',
        'database' : 'solidsundae',
        'debug' : 'false'
    },
    'table' : 'global_uid' // table name of the uid generator
};