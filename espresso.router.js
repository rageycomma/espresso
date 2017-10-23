const   Rx = require("rxjs/Rx"),
        _ = require("lodash"),
        Observable = Rx.Observable,
        Subject = Rx.Subject;

class EspressoRouteSubscriber {

    /**
     * Sets the parent router. 
     * 
     * @param {any} router 
     * @memberof EspressoRouteSubscriber
     */
    setRouterParent(router) { 
        this._router = router;
    }

    done(suc,err=null) { 
        this.routeOutgoingObservable$ = Observable.create((obs) => { 
            if(_.isNil(err)) { 
                obs.error(err);
            } else { 
                obs.next(suc);
            }
        });
        this.routeOutgoingObservableInstance$ = this.routeOutgoingObservable$.multicast(()=>{
            return this.routeItemRespondingSubject;
        });
        this.routeOutgoingObservableInstance$.connect();
    }

    /**
     * Subscribes to router instance to get routing stuff. 
     * 
     * @memberof EspressoRouteSubscriber
     */
    subscribeToRouterInstance() { 
        this._router.routeOutgoingSubject.subscribe(
            success => { 
                this._callback(success,this,false);
            },
            error => { 
                this._callback(error,this,true);
            }
        );
    }

    setCallback(callback) { 
        this._callback = callback; 
    }

    initObservables() {
        this.routeItemRespondingSubject = new Subject();
    }

    constructor(router_instance, callback) { 
        this.initObservables();
        this.setCallback(callback);
        this.setRouterParent(router_instance);
        this.subscribeToRouterInstance();
    }
}

class EspressoRouter { 

    /**
     * Sets the instance this route is linked to. 
     * 
     * @param {any} instance 
     * @memberof EspressoRouteSubscriber
     */
    setRouterServerInstance(instance) { 
        this._instance = instance; 
    }

    doRouteOutgoing(self,res,is_error) { 
        self.routeOutgoing$ = Observable.create((obs)=>{
            if(is_error) { 
                obs.error(res);
            } else { 
                obs.next(res);
            }
        });
        self.routeOutgoingInstance$ = self.routeOutgoing$.multicast(()=>{
            return self.routeOutgoingSubject;
        });
        self.routeOutgoingInstance$.connect();      
    }

    /**
     * Subscribe to server instance. 
     * 
     * @param {any} instance 
     * @memberof EspressoRouteSubscriber
     */
    subscribeToServerInstance() { 
        const self = this;

        self._instance.serverIncomingSubject.subscribe(
            result => { 
                this.doRouteOutgoing(self,result,false);
            },
            error => { 
                this.doRouteOutgoing(self,error,true);
            }
        );
    }

    
    subscribeToRouteResponse(route_item) { 
        route_item.routeItemRespondingSubject.subscribe(
            result => { 
                var x = 'y';
            },
            error => { 
                var x = 'u';
            }
        );
    }

    addRouteItem(route_item) { 
        if(!_.isArray(this.routes)) { 
            this.routes = [];
        }
        this.subscribeToRouteResponse(route_item);
        this.routes.push(route_item);
    }


    initObservables() { 
        this.responseToServerSubject = new Subject();  
        this.routeOutgoingSubject = new Subject(); 
    }

    constructor(server_instance) { 
        this.initObservables();
        this.setRouterServerInstance(server_instance);
        this.subscribeToServerInstance();
    }
}

module.exports.EspressoRouteSubscriber = EspressoRouteSubscriber;
module.exports.EspressoRouter = EspressoRouter;