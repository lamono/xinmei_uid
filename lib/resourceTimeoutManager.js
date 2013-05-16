var uuidGen = require('./uuidGenerator.js');

var resourceTimeoutManager = function(pool, timeoutThreshold, type){
    this.resource = {};
    this.timeoutThreshold = timeoutThreshold ? timeoutThreshold : 10000; //default timeout is 10 second
    this.type = type;
    this.pool = pool;

    this.intervalId = setInterval(function(rTM){
        for(var key in rTM.resource){
            if(new Date() - rTM.resource[key].time >= rTM.timeoutThreshold){
                switch(rTM.type){
                    case 'mysql' :
                        console.log('exceed timeout, delete it');
                        rTM.pool.destroy(rTM.resource[key].obj);
                        rTM.resource[key].obj.destroy();
                        delete rTM.resource[key];
                        break;
                }
            }else{
                console.log('not exceed timeout');
            }
        }

        console.log('timeout obj', rTM.resource);

    }, this.timeoutThreshold, this);

};

var p = resourceTimeoutManager.prototype;

p.setResource = function(obj){
    var uid = uuidGen();
    if(this.resource[uid] != null){
        return -1;
    }
    this.resource[uid] = {
        'obj' : obj,
        'time' : new Date()
    };
    return uid;
};

p.delResource = function(uid){
    if(this.resource[uid] != null){
        delete this.resource[uid];
        return true;
    }else{
        return false;
    }
};

module.exports = resourceTimeoutManager;