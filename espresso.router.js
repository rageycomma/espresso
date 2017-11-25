const   Rx = require("rxjs/Rx"),
        _ = require("lodash"),
        uuid = require('uuid/v4'),
        Observable = Rx.Observable,
        Subject = Rx.Subject;


const   HttpStatuses = require('./espresso.variables'),
        Statuses = HttpStatuses.EspressoServerHttpStatuses,
        Errors = require('./espresso.errors'),
        EspressoServerNonUniformResponseError = Errors.EspressoServerNonUniformResponseError;

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

    setStatus(name) { 
        var code = Statuses.get(name);
        if(_.isNil(code)) {
            code = Statuses.get('OK');
        }
        this.content.status = code; 
        return this; 
    }

    addHeader(header_type,value) { 
        var headers = this.content.headers; 
        headers.set(header_type,value);
        this.content.headers = headers;
        return this;
    }

    addHeaders(header_array) { 
        _.each(header_array,(header)=> { 
            this.addHeader(header[0],header[1]);
        }); 
        return this;
    }

    /**
     * Adds content which will return to the router. 
     * 
     * @param {any} content 
     * @memberof EspressoRouteSubscriber
     */
    addContent(content) { 
        this.content.route = this.id;
        this.content.appendContent(content);
        return this; 
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
        this.content = new EspressoRouterContentWrapper();
        this.code = 0;
        this.headers = new Map();
        this.initObservables();
        this.setCallback(callback);
        this.setRouterParent(router_instance);
        this.subscribeToRouterInstance();
    }
}

class EspressoRouterContentWrapper { 

    get route() { 
        return this.route_id;
    }

    set route(route_id) { 
        this.route_id = route_id; 
    }
        
    get headers() { 
        return this.header_items; 
    }

    set headers(header_items) { 
        this.header_items = new Map(header_items);
    }

    get status() { 
        return this.code; 
    }

    set status(status) { 
        this.code = status; 
    }

    /**
     * Appends content,
     * 
     * @param {any} content 
     * @memberof EspressoRouterContentWrapper
     */
    appendContent(content) { 
        if(_.isArray(content) == false) { 
            content = [content];
        } 
        this.content = this.content.concat(content);
    }

    constructor() { 
        this.id = uuid();
        this.header_items = new Map();
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

    get routeIds () { 
        return _.transform(this.routes,(result,n)=>{
            result.push(n.id);
            return true;
        },[]);
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
        this._responding_routes.delete(id);
        this._stored_requests.delete(id);
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

    storeRouteResponse(result) {
        this._stored_requests.set(result.id,result.content);
    }

    collateRouteResponses(result_id, route_id) { 
        var routes = this._responding_routes.get(result_id);
        if(_.isNil(routes)){ 
            this._responding_routes.set(result_id,new Map());
            routes = this._responding_routes.get(result_id);
        }
        routes.set(route_id,true);
        this._responding_routes.set(result_id,routes);
    }

    sendOutgoingResponse(result_id, content,context) { 
        var response = this._incoming_requests.get(result_id);
        var outgoing = response.response; 

        outgoing.addHeadersFromMap(context.header_items);
        outgoing.addContent(content);
        outgoing.setStatusCode(context.code);
        outgoing.sendResponse();
    }

    prepareContentByType(content,type) { 
        if(type == "object") { 
            var _content = _.transform(content,(res,n)=>{
                res = _.merge(res,n);
                return true;
            },{});
            return JSON.stringify(_content);
        } else if(type == "string") { 
            return _.transform(content,(res,n)=>{ 
                res += n;
                return true; 
            },'');
        } else if(type =="number") { 
            return _.transform(content,(res,n)=>{
                res =+ n;
                return true; 
            },0);
        } else { 
            return content;
        }
    }

    prepareOutgoingResponse(result_id) { 
        var result = this._stored_requests.get(result_id),
            out = '';

        if(_.isNil(result)) { 
            throw new EspressoServerTimeoutError();
        }
        if(result.length == 0) { 
            throw new EspressoServerNoActionError();
        } 

        const   types = result.map(resp => typeof resp),
                is_uniform = _.uniq(types).length == 1;

        if(!is_uniform) { 
            throw new EspressoServerNonUniformResponseError();
        }

        return this.prepareContentByType(result,_.uniq(types));
    }

    gatherRouteComplete(result_id) { 
        // Find out which routes responded. 
        var routes = this._responding_routes.get(result_id);

        // It can't be finished because it doesn't exist. 
        if(_.isNil(routes)) {
            return; 
        }

        // Now check if all the routes responded. 
        var routes_returned = _.transform(this.routeIds,(result,n) =>{ 
            result.push(routes.get(n));
            return true;
        },[]);

        return _.every(routes_returned,Boolean);
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
                this.storeRouteResponse(result);
                this.collateRouteResponses(result.id,result.route_id);
                if(this.gatherRouteComplete(result.id)) { 
                    var resp = this.prepareOutgoingResponse(result.id);
                    this.sendOutgoingResponse(result.id,resp,result);
                }
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
        this._responding_routes = new Map();
        this.initObservables();
        this.setRouterServerInstance(server_instance);
        this.subscribeToServerInstance();
    }
}

module.exports.EspressoRouteSubscriber = EspressoRouteSubscriber;
module.exports.EspressoRouter = EspressoRouter;