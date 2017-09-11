const   router = require("./../espresso.router"),
        EspressoServerRouteItem = router.EspressoServerRouteItem,
        EspressoServerRouter = router.EspressoServerRouter,
        _ = require("lodash");

class EspressoRoute { 

    /**
     * Input of an observable to tell this route what to listen to. 
     * 
     * @param {any} observable 
     * @memberof EspressoRoute
     */
    setRouterObservable(observable) { 
        this._routerObservable$ = observable;
    }

    /**
     * Subscribes this router to the observable. 
     * 
     * @memberof EspressoRoute
     */
    subscribeRouterObservable() {
        if(!_.isNil(this._routerObservable$)) { 
            this._routerObservable$.subscribe(
                this._route_callback,
                this._route_error_callback,
                this._route_callback
            );
        }
    }

    /**
     * Route which by default throws an error as default route must be unset. 
     * 
     * @param {any} response 
     * @memberof EspressoRoute
     */
    defaultRoute(response) { 
        throw new Error(); // Should be set. 
    }

    /**
     * Register route logic. 
     * 
     * @memberof EspressoRoute
     */
    route(route_callback) { 
        if(_.isFunction(route_callback)) { 
            this._route_callback = route_callback;
        }
        return this;
    }

    /**
     * Register error handler. 
     * 
     * @memberof EspressoRoute
     */
    error(error_callback) { 
        if(_.isFunction(error_callback)) {
            this._route_error_callback = error_callback;
        }
        return this; 
    }

    /**
     * Register complete handler. 
     * 
     * @param {any} complete_callback 
     * @returns 
     * @memberof EspressoRoute
     */
    complete(complete_callback) { 
        if(_.isFunction(error_callback)) {
            this._route_error_callback = error_callback;
        }
        return this; 
    }

    /**
     * Creates an instance of EspressoRouterRoute.
     * @memberof EspressoRouterRoute
     */
    constructor() {
        this._route_callback = this.defaultRoute;
        this._route_error_callback = this.defaultRoute;

    }

}


class EspressoRouter {

    /**
     * Inits the route change observable.
     * 
     * @returns 
     * @memberof EspressoRouter
     */
    routeChangeObservable() { 
        
        // Why trigger if nothing is picking it up?
        if(this._routes.length ==0) { 
            return false;
        }

        // Register the route change observable.
        this.routeChangedObservable$ = Observable.create((reqObserve)=>{
            var x= "y";
        });

        // Loop each route and set this change observable.
        _.each(this._routes,(route)=>{
            route.setRouterObservable(this.routeChangedObservable$);
        });

    }

    /**
     * Change route. 
     * 
     * @param {any} route 
     * @memberof EspressoRouter
     */
    executeRouteChange(route) {

    }

    /**
     * Adds routes to router instance.
     * 
     * @param {any} routes 
     * @memberof EspressoRouter
     */
    addRoutes(routes) { 
        // Adds routes to object.
        this._routes = _.filter(this._routes,(route)=>{
            return route instanceof EspressoRoute;
        });

        // Register the observable
        this.routeChangeObservable();
    }

   

    /**
     * Creates an instance of EspressoRouter.
     * @memberof EspressoRouter
     */
    constructor() { 
        this._routes = [];
    }

}