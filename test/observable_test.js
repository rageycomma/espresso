const   rxjs = require("rxjs/Rx"),
        Observable = rxjs.Observable,
        _ = require("lodash");


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

    set route(route) {
        this._routes.push(route); 
        route.router = this;
        route.doSubscribe();
    }

    receiveOutputNext(next) {
        this._output.push(next);
    }
    
    receiveOutputError(error) { 
        this._error.push(error);
    }

    receiveOutputSuccess() { 
        this._success = true;
    }

    initObservables() {
        this.routerOutbound$ = Observable.create((req)=>{
            setTimeout(()=>{
                req.next("I am a fucking beast");
            },5000);
        });
    }

    doRouteSubscribe(route) {
        route.outputObservable$.subscribe(
            success => {
                this.receiveOutputNext(success);
            },
            error =>{
                this.receiveOutputError(error);
            },
            complete => {
                this.receiveOutputSuccess();
            }
        );
    }

    constructor() { 
        this.initObservables();
        this._routes = [];
        this._output = [];
        this._error = [];
    }

}


class TestObservableRoute { 
     
    initObservables() { 
        const self = this;
    }

    incomingFromRouterSuccess(success,self) { 
        this._callback(self);
    }

    incomingFromRouterError(error,self) { 
        var y = "z";
    }

    incomingFromRouterComplete(self) {
        var z = "y";
    }

    doSubscribe() {
        const self = this; 

        this._router.routerOutbound$.subscribe(
            success =>{ 
                this.incomingFromRouterSuccess(success,self);
            },
            error => {
                this.incomingFromRouterError(error,self);
            },
            complete => {
                this.incomingFromRouterComplete(self);
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
var x = new TestObservableRoute((cb)=>{
    var zz= 'aa';
});
y.route = x;
var z = 'shabba';

