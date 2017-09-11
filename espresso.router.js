const   _ = require("lodash"),
        Observable = require("rxjs/Rx").Observable;

/**
 * Individual route item for routing traffic.
 * 
 * @class EspressoServerRouteItem
 */
class EspressoServerRouteItem {


    /**
     * Get default path requirements. 
     * 
     * @returns 
     * @memberof EspressoServerRouteItem
     */
    getDefaultRouteRequirementParameters() {
        return {
            pattern: /(.*)/
        };
    }

    /**
     * Matches based upon parsed parameters.
     * 
     * @memberof EspressoServerRouteItem
     */
    matchParams(route) { 
        var matches = true,
            exitMatch = false,
            rl = route._path.length;

        for(var i =0; i<= rl; i++){
            var _path = route._path[i],
                _route = this._paths[i];

            // Is this a parameter?
            if(this._param_numbers.indexOf(i) != -1) {
                if(_route.pattern instanceof RegExp){
                    matches = _route.pattern.exec(_path);
                    if(!matches) {
                        exitMatch = true;
                        i=rl;
                    } 
                } 
            } else { 
                matches = _path == _route;
                if(!matches) {
                    exitMatch = true;
                    i=rl;
                }
            }
        }

        return exitMatch != true && matches;
    }

    /**
     * Ensures all parameters are set correctly.
     * 
     * @memberof EspressoServerRouteItem
     */
    defaultParams() {
        this._params = _.transform(this._defaults,(ret,val)=>{
            ret.push(_.defaults(val,this.getDefaultRouteRequirementParameters()));
        });
    }

    /**
     * Matches route.
     * 
     * @param {any} route 
     * @memberof EspressoServerRouteItem
     */
    matchRoute(route) {

        // First, check if it straight-off matches.
        if(route.path == this.path)
            return true;
     
        var hasRequirements = Object.keys(this.path_requirements).length >0;
        var hasParams = this._params.length >0;

        // If it doesn't have parameters, why bother?
        if(!hasParams)
            return false;

        // If there are parameters, let's match those. 
        if(hasParams) {
            // If it has requirements, match them..
            if(hasRequirements) {
                // Get keys of path requirements.
                var req_keys = Object.keys(this.path_requirements);

                // Now key keys of params
                var param_keys = _.transform(this._params,(it,val)=>{
                        it.push(val.name);
                        return true;
                });

                // Now find out if the params are covered by the requirements.
                var param_match = _.intersection(req_keys,param_keys);

                // If they don't, we need to default the requirements for the uncovered keys.
                if(param_match.length != param_keys.length) { 
                    
                    // Get differences.
                    var dif = _.difference(param_keys,param_match);

                    var _def = this.getDefaultRouteRequirementParameters();

                    // Now zip an object with the default.
                    var _dez = _.fill(Array(dif.length),_def);

                    // Now create the defaults. 
                    var _new = _.zipObject(dif,_dez);

                    // Parameters now defaulted! 
                    this._params = _.merge(this._params,_new);
                } 

            } else {
                var __def = this.getDefaultRouteRequirementParameters();
                var __dez = _.fill(Array(this._params.length),__def);
                this._params = _.merge(this._params,__dez);
            }
        }

        return this.matchParams(route);
    }


    /**
     * Subscribes route to router observable.
     * 
     * @param {any} observable 
     * @memberof EspressoServerRouteItem
     */
    subscribeRoute(obs) {
        if(obs instanceof Observable) {
            observable.subscribe(
                this.matchParams
            );
        }

    }

    /**
     * Parses a route item.
     * 
     * @memberof EspressoServerRouteItem
     */
    parseRoute() { 
        
        var self = this;

        // Get the elements
        var paths = this.path.substring(1,this.path.length).split("/");

        // Get the params.
        var params = _.transform(paths,(res,path_item,key) =>{
            if(path_item.substring(0,1) == "{" && path_item.substring(path_item.length-1,path_item.length) == "}")
                self._param_numbers.push(key);
                res[key] = {
                    name:  path_item.substring(1,path_item.length-1),
                    key: key
                };
            return true;
        });

        this._paths = _.isNil(paths) ? [] : paths;
        this._params = _.isNil(params) ? [] : params;
    }

    /**
     * Register observables for the router to observe to. 
     * 
     * @memberof EspressoServerRouteItem
     */
    registerObservables() {

        // When the route item passes back stuff (i.e. When the callback passes data back.)
        this.onCallbackObservable$ = Observable;
    }

    constructor(
        path,
        method,
        format,
        handler,
        path_requirements = {}
    ) {
        this.path = path;
        this.path_requirements = path_requirements;
        this.method = method;
        this.format = format;
        this.handler = handler;
        this._param_numbers = [];
        this.registerObservables();
        this.parseRoute();
    }
}

/**
 * Defines routes for a given ServerInstance
 * 
 * @class EspressoServerRoutes
 */
class EspressoServerRouter {
    
    /**
     * Subscribes to routes on router items.
     * 
     * @memberof EspressoServerRouter
     */
    subscribeRoutes() {

    }

    /**
     * Create cold observable. 
     * 
     * @memberof EspressoServerRouter
     */
    initiateObservables() { 
        this.routingObservable$ = Observable.create((reqObserve)=>{
            reqObserve.next(true);
        });
    }

    /**
     * Adds routes to router item.
     * 
     * @param {any} routes 
     * @memberof EspressoServerRouter
     */
    addRoutes(routes) { 
        var self = this;

        // Routes
        var _routes = [];

        // Loop routes
        _.each(routes,(route)=>{
            if(!(route instanceof EspressoServerRouteItem) && _.isObject(route)) { 
                if(_.isNil(route.path) == false && _.isNil(route.method) == false && _.isNil(route.format) == false && _.isNil(route.handler) == false) { 
                    var path_requirements = _.isNil(route.path_requirements) ? {} : route.path_requirements;
                    var _route = new EspressoServerRouteItem(route.path,route.method,route.format,route.handler,path_requirements);
                    _routes.push(route);   
                    
                }
            } else if((route instanceof EspressoServerRouteItem)) { 
                _routes.push(route);
            } else { 
                return false;
            }    
        });
        this._routes = _routes;
        this.subscribeRoutes();             
    }

    /**
     * Parse routes.
     * 
     * @param {any} route_object 
     * @memberof EspressoServerRouter
     */
    setRoutes(route_array) {
        this._routes  = _.filter(route_object,(route_item)=>{
            if(route instanceof EspressoServerRouteItem) { 
                return route_item;
            }
        });
    }

    /**
     * Runs route matching.
     * @memberof EspressoServerRoutes
     */
    runRoutes(route_item, listen) {
        this.registerRouteChangeObservable$ = Observable.create((reqObject)=>{
            var availableRoutes = _.filter(this._routes,(route)=>{
                reqObserve.next(route_item,listen);
            });
        });
    }


    /**
     * Creates an instance of EspressoServerRoutes.
     * @param {any} route_array 
     * @memberof EspressoServerRoutes
     */
    constructor() {
        this.initiateObservables();
        this._routes = [];
    }
}

module.exports.EspressoServerRouter = EspressoServerRouter;
module.exports.EspressoServerRouteItem = EspressoServerRouteItem;