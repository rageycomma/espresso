const   rxjs = require("rxjs/Rx"),
        Observable = rxjs.Observable,
        uuid =require('uuid/v4'),
        _ = require("lodash");


class TestObservableItem { 
    constructor(content, _uuid = uuid()) {
        this.id = _uuid;
        this.content = content;  
    }
}

class TestObservableItemOperation { 
    constructor(id,op) {
        this.id = id;
        this.op = op;
    }
}

class TestObservableRouter {

    get routes() { 
        return this.routes; 
    }

    set routes(routes) { 
        this.routes = routes; 
    }

    get route () {
        return this.routes; 
    }

    set route(route) 
    {
        const len = this._routes.length;
        this._routes[len] = route; 
        route.router = this;
        route.doSubscribe();
        route._iteration = len;
    }

    createOutput(output) { 
        return new TestObservableItem(output);
    }

    subscribeToAllRoutes() { 
        _.each(this._routes,(route)=>{
            this.doRouteSubscribe(route);
        });
    }

    initObservables() {
        const self = this;

        this.routerOutbound$ = Observable.create((req)=>{
            setTimeout(()=>{
                var output = this.createOutput("tet");
                req.next(output);
                self.subscribeToAllRoutes();
            },5000);
        });
    }

    initialiseRouteResponse(id) { 
        if(_.isNil(this._route_responses[id])) { 
            this._route_responses[id] = { 
                content: [],
                errors: [],
                completed: false
            };
        }
    }

    addRouteResponse(id,content) { 
        this._route_responses[id].content.push(content);
    }

    addRouteError(id,content) { 
        this._route_responses[id].errors.push(content);
    }

    setRouteComplete(id) { 
        this._route_responses[id].completed = true; 
    }

    receiveRouteReturnSuccess(success) { 
        if(success instanceof TestObservableItem) {
            const id = success.id; 
            this.initialiseRouteResponse(id);
            this.addRouteResponse(id,success.content);
        } else {
            if(success.op == "end") { 
                this.setRouteComplete(success.id);
            }
        }
    }

    receiveRouteReturnError(error) { 
        const id = error.id;
        this.initialiseRouteResponse(id);
        this.addRouteError(id,error.content.content);
    }


    doRouteSubscribe(route) {
        const self = this;

        route.outputObservable$.subscribe(
            success => {
                this.receiveRouteReturnSuccess(success);
            },
            error =>{
                this.receiveRouteReturnError(error);
            }
        );
    }

    constructor() { 
        this.initObservables();
        this._routes = [];
        this._output = [];
        this._error = [];
        this._route_responses = {};
    }

}

class TestObservableRouteContainer { 
    
    /**
     * Adds output to the outgoing stream. 
     * 
     * @param {any} output 
     * @memberof TestObservableRouteContainer
     */
    addOutput(output) { 
        var out = this.oo;
        out.content = output;
        this.observable.next(out);
    }

    end() { 
        this.observable.next(new TestObservableItemOperation(this.oo.id,"end"));
    }

    error(error) { 
        var out = this.oo;
        out.content = error instanceof Error ? error : new Error(error);
        this.observable.error(out);
    }

    do() {
        try {
            this.callback(this);
        } catch(Error) { 
            this.error(new TestObservableItem(Error));
        }
    }

    constructor(guid, obs,cb) {
        this.guid = guid;
        this.observable = obs; 
        this.callback = cb;
        this.oo = new TestObservableItem();
        this.output =[];
    }
}


class TestObservableRoute { 
     
    initObservables() { 
        const self = this;
        this.outputObservable$ = Observable.create((re)=>{
            var to = new TestObservableRouteContainer(self._result.guid,re,self._callback);
            to.do();
        });
    }

    incomingFromRouterSuccess(success,self) { 
        this._result = success;
    }

    incomingFromRouterError(error,self) { 
        this._result = error;
    }

    doSubscribe() {
        const self = this; 

        this._router.routerOutbound$.subscribe(
            success =>{ 
                this.incomingFromRouterSuccess(success,self);
            },
            error => {
                this.incomingFromRouterError(error,self);
            }
        );
    }

    get router() {
        return this._router;
    }

    set router(router) { 
        this._router = router;
    }
 
    get output() { 
        return this._output;
    }

    set output(output) { 
        this._output.push(output);
    }

    get error() { 
        return this._error;
    }

    set error(error) { 
        this._error.push(error);
    }

    get complete() { 
        return this._complete;
    }

    set complete(complete) { 
        this._complete = complete;
    }

    constructor(route_callback) { 
        this._output = [];
        this._error = [];
        this._complete = false;
        this._callback = route_callback;
        this.initObservables();
    }

}
var y = new TestObservableRouter();
var x = new TestObservableRoute((res)=>{
    res.addOutput("Added 1");
    res.addOutput("Added 2");
    res.addOutput("Added 3");
    res.end();
});

y.route = x;
var z = 'shabba';

