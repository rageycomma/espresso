const { EspressoErrorInvalidRouteParameters } = require('./EspressoErrors');
const {
  EspressoRouteCommandIdle,
  EspressoErrorInvalidRouteAction,
  EspressoRouteCommandCanRoute,
  EspressoRouteCommandReturnData
} = require('./EspressoConst');
const { BehaviorSubject } = require('rxjs/BehaviorSubject');
const UrlPattern = require('url-pattern');
const uuid = require('uuid/v4');

/**
 * An item passed from the router to the route item.
 *
 * @class EspressoRouterCommand
 */
class EspressoRouterCommand {
  constructor(action, data) {
    this.Action = action;
    this.Data = data;
    this.Data.id = uuid();
  }
}

/**
 * Options passed to an espresso route.
 *
 * @class EspressoRouteOptions
 */
class EspressoRouteOptions {
  /**
   * Getter for route path.
   *
   * @readonly
   * @memberof EspressoRouteOptions
   */
  get path() {
    return this.RoutePath;
  }

  /**
   * Setter for the route path/
   *
   * @param {string} val The route path.
   * @memberof EspressoRouteOptions
   */
  set path(val) {
    this.RoutePath = val;
  }

  /**
   * Getter for the MIME type.
   *
   * @readonly
   * @memberof EspressoRouteOptions
   */
  get mimeType() {
    return this.RouteFormat;
  }

  /**
   * Setter for mimetype.
   * @param {string} val The MIME type.
   * @memberof EspressoRouteOptions
   */
  set mimeType(val) {
    this.RouteFormat = val;
  }

  /**
   * Sets the path requirements for a path.
   * @param {object} val The path requirements.
   * @memberof EspressoRouteOptions
   */
  set requirements(val) {
    this.PathRequirements = val;
  }

  /**
   * Set the action.
   * @param {function} val The function to call.
   * @memberof EspressoRouteOptions
   */
  set action(val) {
    // If it's not a function, you fucked up.
    if (typeof val !== 'function') {
      throw new EspressoErrorInvalidRouteAction();
    }

    // Sets the path action.
    this.PathAction = val;
  }

  /**
   * Getter for the action.
   *
   * @readonly
   * @memberof EspressoRouteOptions
   */
  get action() {
    return this.PathAction;
  }

  /**
   * Validates the options passed to this options class.
   *
   * @memberof EspressoRouteOptions
   * @returns {void}
   */
  validateOptions() {
    if (this.mimeType === null || this.path === null || this.action === null) {
      throw new EspressoErrorInvalidRouteParameters();
    }
  }

  /**
   * Creates an instance of EspressoRouteOptions.
   * @param {any} options The options to set, corresponding to the properties of the route options.
   * @memberof EspressoRouteOptions
   */
  constructor(options) {
    Object.assign(this, options);
    this.validateOptions();
  }
}

/**
 * An individual route item.
 *
 * @class EspressoRoute
 */
class EspressoRoute {
  /**
   * Create observables for the route.
   *
   * @memberof EspressoRoute
   * @returns {void}
   */
  init() {
    this.routeResponse$ = new BehaviorSubject(EspressoRouteCommandIdle);
  }

  /**
   * Sets the router to which this route will subscribe.
   *
   * @param {EspressoRouter} router The router.
   * @memberof EspressoRoute
   * @returns {void}
   */
  setParentRouter(router) {
    this.Router = router;
    this.routeSubscribeToRouterOutput();
  }

  /**
   * Can this route item route the item provided?
   *
   * @param {any} data Data from the route.
   * @memberof EspressoRoute
   * @returns {void}
   */
  canRoute(data) {
    // If there's no path or it's empty, we can't do anything.
    if (data.path === null || data.path === '') {
      throw new EspressoErrorInvalidRouteParameters();
    }

    // Use url-pattern (Note: may need to switch off this in the future to a custom path parser.)
    return this.UrlPattern.match(data.path);
  }

  /**
   * Process command from router.
   *
   * @param {string} command Command from the parent router.
   * @memberof EspressoRoute
   * @returns {void}
   */
  processRouterCommand(command) {
    // Respond if the route will route this item.
    if (command.Action === EspressoRouteCommandCanRoute) {
      this.sendRouteResponse(command, {
        path: command.data.path,
        routeResponse: {
          canRoute: this.canRoute(command.data.path)
        },
        id: command.data.id
      });
    }
  }

  processRouterError(error) {
    let x = 'y';
  }

  terminateRouterSubscription() {
    this.Router.suc().unsubscribe();
  }

  /**
   * Instruct router to subscribe to router outputs.
   *
   * @memberof EspressoRoute
   * @return {void}
   */
  routeSubscribeToRouterOutput() {
    this.RouterSubscription = this.Router.subscribeToOutgoingCommand(this).subscribe((data) => {
      this.processRouterCommand(data);
    }, (error) => {
      this.processRouterError(error);
    }, () => {
      this.terminateRouterSubscription();
    });
  }

  /**
   * Function for router to subscribe to route's response.
   *
   * @memberof EspressoRoute
   * @returns {void}
   */
  routerSubscribeToRouteResponse() {
    return this.routeResponse$;
  }

  /**
   * Sends a route response.
   *
   * @param {string} operation The operation to occur.
   * @param {object} data The data to send.
   * @memberof EspressoRoute
   * @returns {void}
   */
  sendRouteResponse(operation, data) {
    this.routeResponse$.next(new EspressoRouterCommand(operation, data));
  }

  /**
   * Parses the options coming into the route.
   * @param {object} options The options for the route.
   * @memberof EspressoRoute
   * @return {void}
   */
  parseOptions(options) {
    this.Options = new EspressoRouteOptions(options);
    this.UrlPattern = new UrlPattern(this.Options.path);
  }

  /**
   * Creates an instance of EspressoRoute.
   * @param {any} options Options for the route.
   * @memberof EspressoRoute
   */
  constructor(options) {
    this.parseOptions(options);
    this.init();
  }
}

/**
 * Handles the routing of items.
 *
 * @class EspressoRouter
 */
class EspressoRouter {
  /**
   * Initialises subjects.
   *
   * @memberof EspressoRouter
   * @returns {void}
   */
  init() {
    this.Routes = [];
    this.outgoingCommand$ =
      new BehaviorSubject(new EspressoRouterCommand(EspressoRouteCommandIdle, {}));
  }

  /**
   * Subscribe to a reponse from the route that just subscribed to the router.
   *
   * @param {EspressoRoute} route The route item
   * @memberof EspressoRouter
   * @returns {void}
   */
  subscribeToRouteResponse(route) {
    route.routerSubscribeToRouteResponse().subscribe((response)=>{
      var x = 'u';
    }, (error) =>{
      var x = 'u';
    }, () =>{
      var x = 'u';
    })
  }

  /**
   * Subscribe to an outgoing command.
   *
   * @param {EspressoRoute} route The espresso route.
   * @returns {Observable} The observable for the outgoing command.
   * @memberof EspressoRouter
   */
  subscribeToOutgoingCommand(route) {
    this.subscribeToRouteResponse(route);
    return this.outgoingCommand$;
  }

  /**
   * Adds a route to the router's list of routes.
   *
   * @param {EspressoRoute} route The route.
   * @memberof EspressoRouter
   * @returns {void}
   */
  addRoute(route) {
    // Set the parent router for that item.
    route.setParentRouter(this);

    // Add the route to the list of items.
    this.Routes.push(route);
  }

  /**
   * Sends an outgoing command to route.
   *
   * @param {string} command The command. (Detailed in Consts)
   * @param {any} data The data/parameters to use.
   * @memberof EspressoRouter
   * @returns {void}
   */
  sendOutgoingCommand(command, data) {
    this.outgoingCommand$.next(new EspressoRouterCommand(command, data));
  }

  /**
   * Creates an instance of EspressoRouter.
   * @memberof EspressoRouter
   */
  constructor() {
    this.init();
  }
}

module.exports = {
  EspressoRouterCommand,
  EspressoRoute,
  EspressoRouteOptions,
  EspressoRouter
};
