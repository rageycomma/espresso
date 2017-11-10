const   Rx = require("rxjs/Rx"),
        _ = require("lodash"),
        uuid = require('uuid/v4'),
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

    /**
     * Signals that the route has finished routing.
     * 
     * @memberof EspressoRouteSubscriber
     */
    done() { 
        const self = this;
        this.routeOutgoingObservable$ = Observable.create((obs) => { 
            if(!_.isNil(self.error)) { 
                obs.error(self.error);
            } else { 
                obs.next(self.content);
            }
        });
        this.routeOutgoingObservableInstance$ = this.routeOutgoingObservable$.multicast(()=>{
            return this.routeItemRespondingSubject;
        });
        this.routeOutgoingObservableInstance$.connect();
    }

    /**
     * Adds content which will return to the router. 
     * 
     * @param {any} content 
     * @memberof EspressoRouteSubscriber
     */
    addContent(content) { 
        this.content.appendContent(content);
    }

    /**
     * Subscribes to router instance to get routing stuff. 
     * 
     * @memberof EspressoRouteSubscriber
     */
    subscribeToRouterInstance() { 
        this._router.routeOutgoingSubject.subscribe(
            success => {
                this.content = success;
                this._callback(this);
            },
            error => { 
                this.error = error;
                this._callback(this);
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
        this.id = uuid();
        this.initObservables();
        this.setCallback(callback);
        this.setRouterParent(router_instance);
        this.subscribeToRouterInstance();
    }
}

class EspressoRouterContentWrapper { 

    /**
     * Appends content,
     * 
     * @param {any} content 
     * @memberof EspressoRouterContentWrapper
     */
    appendContent(content) { 
        if(_.isArray(content)) { 
            this._content = this._content.concat(content);
        } else { 
            this.content.push(content);
        }
    }

    constructor() { 
        this.id = uuid();
        this.content = [];
    }
}


class EspressoRouter { 

    /**
     * Default timeout for router requests. 
     * 
     * @readonly
     * @memberof EspressoRouter
     */
    get ROUTER_TIMEOUT() { 
        return 60000;
    }

    /**
     * Sets the instance this route is linked to. 
     * 
     * @param {any} instance 
     * @memberof EspressoRouteSubscriber
     */
    setRouterServerInstance(instance) { 
        this._instance = instance; 
    }

    /**
     * Removes a request when timed out. 
     * 
     * @param {any} id 
     * @memberof EspressoRouter
     */
    removeRequest(id) { 
        this._incoming_requests.delete(id);
    }

    /**
     * Routes outgoing traffic to path.
     * 
     * @param {any} self 
     * @param {any} res 
     * @param {any} is_error 
     * @memberof EspressoRouter
     */
    doRouteOutgoing(self,res,is_error) { 
        self.routeOutgoing$ = Observable.create((obs)=>{
            if(is_error) { 
                obs.error(res);
            } else { 
                var outgoing = new EspressoRouterContentWrapper();
                self._incoming_requests.set(outgoing.id,res);
                setTimeout(()=>{
                    self.removeRequest(outgoing.id);
                },self.ROUTER_TIMEOUT);
                obs.next(outgoing);
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

    storeRouteResponse() {

    }

    /**
     * Subscribes to the route item, which provides a response back.
     * 
     * @param {any} route_item 
     * @memberof EspressoRouter
     */
    subscribeToRouteResponse(route_item) { 
        route_item.routeItemRespondingSubject.subscribe(
            result => { 
                this.storeRouteResponse();
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
        this._incoming_requests = new Map();
        this._stored_requests = new Map();
        this.initObservables();
        this.setRouterServerInstance(server_instance);
        this.subscribeToServerInstance();
    }
}

module.exports.EspressoRouteSubscriber = EspressoRouteSubscriber;
module.exports.EspressoRouter = EspressoRouter;