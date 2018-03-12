const { EspressoErrorInvalidRouteParameters, EspressoErrorRouteTimeout } = require('./EspressoErrors');
const {
  EspressoRouteCommandIdle,
  EspressoErrorInvalidRouteAction,
  EspressoRouteCommandDoRoute,
  EspressoRouteChangeTypeContent,
  EspressoRouteChangeTypeHeaders
} = require('./EspressoConst');

const { EspressoChange } = require('./EspressoCommon');
const { BehaviorSubject, Observable } = require('rxjs');
const UrlPattern = require('url-pattern');
const uuid = require('uuid/v4');
const {isObject, isNil} = require('lodash');
const _ = { isObject, isNil};
/**
 * An item passed from the router to the route item.
 *
 * @class EspressoRouterCommand
 */
class EspressoRouterCommand {
  constructor(action, data) {
    this.Action = action;
    this.Id = uuid();
    this.Data = data;
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
   * Set the timeout for the observable used.
   *
   * @param {number} val in milliseconds.
   * @memberof EspressoRouteOptions
   * @returns {void}
   */
  set timeout(val) {
    this.Timeout = val;
  }

  /**
   * Gets the timeout.
   *
   * @readonly
   * @memberof EspressoRouteOptions
   */
  get timeout() {
    return this.Timeout || 300;
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
 * Container for operations performed by routes or modules.
 *
 * @class EspressoRouteActionWrapper
 */
class EspressoModuleContainer {
  /**
   * Tells Espresso that this module has completed its actions.
   *
   * @memberof EspressoModuleContainer
   * @returns {void}
   */
  done() {
    this.moduleOutgoing$.complete();
    return this;
  }

  /**
   * Add headers.
   * @param {array} headers Array of headers.
   * @memberof EspressoModuleContainer
   * @returns {object} This instance to allow chaining.
   */
  addHeaders(headers) {
    let change = new EspressoChange(EspressoRouteChangeTypeHeaders, this.headers, headers, this.CurrentCommandId);
    headers.forEach(value => this.headers.set(value[0], value[1]));
    change.currentValue = this.headers;
    this.moduleOutgoing$.next(change);
    return this;
  }

  /**
   * Sets the command for the wrapper, so it knows where it's going back.
   *
   * @param {any} command The command.
   * @memberof EspressoModuleContainer
   * @returns {object} This instance to allow chaining.
   */
  setCurrentCommandId(command) {
    this.CurrentCommandId = command;
  }

  /**
   * Delete headers from object.
   *
   * @param {any} headers Headers to delete.
   * @memberof EspressoModuleContainer
   * @returns {object} This instance to allow chaining.
   */
  deleteHeaders(headers) {
    const currHeaders = this.headers;
    let change = new EspressoChange(EspressoRouteChangeTypeHeaders, currHeaders, headers, this.CurrentCommandId);
    headers.forEach(value => this.headers.delete(value));
    change.currentValue = this.headers;
    this.moduleOutgoing$.next(change);
    return this;
  }

  /**
   * Shorthand for adding content-type header.
   *
   * @param {string} contentType The MIME Type.
   * @memberof EspressoModuleContainer
   * @returns {object} This instance to allow chaining.
   */
  contentType(contentType) {
    this.headers.set('Content-Type', contentType);
    return this;
  }

  /**
   * Adds content to the stream for content.
   * Content here is left to the discretion of the user.
   *
   * @param {any} content The content to add.
   * @memberof EspressoModuleContainer
   * @returns {object} This instance to allow chaining.
   */
  addContent(content) {
    const change = new EspressoChange(EspressoRouteChangeTypeContent, this.Content, content, this.CurrentCommandId);
    this.Content = content;
    this.moduleOutgoing$.next(change);
    return this;
  }

  /**
   * Sets the error to be pushed out to the route.
   *
   * @param {Error} error The error to be added.
   * @returns {object} This instance to allow chaining.
   * @memberof EspressoModuleContainer
   */
  setError(error) {
    this.Error = error;
    this.moduleOutgoing$.error(this.Error);
    return this;
  }

  /**
   * Subscribe to changes (called by router)
   *
   * @memberof EspressoModuleContainer
   * @returns {Observable} The observable for the outgoing module changes.
   */
  subscribeToChanges() {
    return this.moduleOutgoing$;
  }

  /**
   * Sets the timeout for the item.
   *
   * @param {number} timeout The timeout.
   * @memberof EspressoModuleContainer
   * @returns {object} This instance to allow chaining.
   */
  setTimeout(timeout) {
    this.moduleOutgoing$.timeout(timeout, new EspressoErrorRouteTimeout());
    return this;
  }

  /**
   * Initialises all subjects.
   *
   * @memberof EspressoModuleContainer
   * @returns {void}
   */
  init() {
    this.headers = new Map();
    this.moduleOutgoing$ = new BehaviorSubject(null);
  }

  /**
   * Creates an instance of EspressoModuleContainer.
   * @memberof EspressoModuleContainer
   */
  constructor() {
    this.init();
  }
}

/**
 * An individual route item.
 *
 * @class EspressoRoute
 */
class EspressoRoute {
  /**
   * Process the route as complete, module container has completed running actions.
   *
   * @memberof EspressoRoute
   * @returns {void}
   */
  processRouteComplete() {

  }

  /**
   * Subscribe to changes from the container.
   *
   * @memberof EspressoRoute
   * @returns {void}
   */
  subscribeToContainerChanges() {
    this.container.subscribeToChanges().timeout(this.Options.timeout).subscribe((changes) => {
      if (_.isNil(changes)) {
        return;
      }
      let x = 'yu';
    }, (error) => {
      let x = 'y';
    }, () => {
      this.processRouteComplete();
    });
  }

  /**
   * Runs the command specified on the route.
   * The return will be picked up by subscribeToContainerChanges.
   *
   * @param {EspressoRouterCommand} currentCommand The current command.
   * @memberof EspressoRoute
   * @returns {void}
   */
  runRouteAction(currentCommand) {
    try {
      // Set the current command so we know what we're doing.
      this.container.CurrentCommandId = currentCommand.Id;

      // Try to call the action, just in case it throws an error.
      this.Options.action(this.container);
    } catch (actionError) {
      // Catch the error, don't rethrow it (at ease, douchebags) and add to the container errors.
      this.container.setError(actionError);
    }
  }

  /**
   * Create observables for the route.
   *
   * @memberof EspressoRoute
   * @returns {void}
   */
  init() {
    this.routeResponse$ =
      new BehaviorSubject(new EspressoRouterCommand(EspressoRouteCommandIdle, {}));
    this.routeId = uuid();
    this.container = new EspressoModuleContainer();
    this.subscribeToContainerChanges();
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
    this.routeSubscribeToRouterCommand();
  }

  /**
   * Can this route item route the item provided?
   *
   * @param {any} path Path from the router.
   * @memberof EspressoRoute
   * @returns {void}
   */
  canRoute(path) {
    // If there's no path or it's empty, we can't do anything.
    if (path === null || path === '') {
      throw new EspressoErrorInvalidRouteParameters();
    }

    // Use url-pattern (Note: may need to switch off this in the future to a custom path parser.)
    const isMatch = this.UrlPattern.match(path);

    // I don't like this, it's sloppy. (TODO: Replace url-pattern..)
    return isObject(isMatch);
  }

  /**
   * Process command from router.
   *
   * @param {string} command Command from the parent router.
   * @memberof EspressoRoute
   * @returns {void}
   */
  processRouterCommand(command) {
    if (command.Action === EspressoRouteCommandIdle) {
      return;
    }

    // Respond if the route will route this item.
    if (command.Action === EspressoRouteCommandDoRoute) {
      if (this.canRoute(command.Data.path)) {
        this.runRouteAction(command);
      }
    }
  }

  /**
   * Processes an error coming from the router.
   *
   * @param {any} error Error from router.
   * @memberof EspressoRoute
   * @returns {void}
   */
  processRouterError(error) {
    throw new EspressoErrorInvalidRouteAction(error);
  }

  /**
   * Unsubscribes from the router.
   *
   * @memberof EspressoRoute
   * @returns {void}
   */
  terminateRouterSubscription() {
    this.Router.suc().unsubscribe();
  }

  /**
   * Instruct route to subscribe to router outputs.
   *
   * @memberof EspressoRoute
   * @return {void}
   */
  routeSubscribeToRouterCommand() {
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
   * Builds the response map.
   *
   * @memberof EspressoRouter
   * @returns {void}
   */
  buildResponseMap() {
    this.responseMap = new Map();
  }

  /**
   * Process route response.
   *
   * @param {any} response Response from the route.
   * @memberof EspressoRouter
   * @returns {void}
   */
  processRouteResponse(response) {
    if (response.Action === EspressoRouteCommandIdle) {
      return;
    }

    if (response.Action === EspressoRouteCommandDoRoute) {
      const x = 'y';
    }
  }

  /**
   * Subscribe to a reponse from the route that just subscribed to the router.
   *
   * @param {EspressoRoute} route The route item
   * @memberof EspressoRouter
   * @returns {void}
   */
  subscribeToRouteResponse(route) {
    route.routerSubscribeToRouteResponse().subscribe((response) => {
      this.processRouteResponse(response);
    }, (error) => {
      this.processRouteError(error);
    }, () => {
      this.processRouteComplete();
    });
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
  EspressoModuleContainer,
  EspressoRouterCommand,
  EspressoRoute,
  EspressoRouteOptions,
  EspressoRouter
};
