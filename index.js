const   http = require("http"), 
        _ = require("lodash"),
        uuidv4 = require("uuid/v4"),
        Rx = require("rxjs/Rx");


class EspressoServerTimeoutError {
    constructor(code = "Ex00001",message = "The request could not be fulfilled as it timed out. If incoming data is being truncated, please change the timeout value.") {}
}

class EspressoServerUnsupportedMIMETypeError { 
    constructor(code = "Ex00002" ,message = "The MIME Type provided is not supported.") {}
}

class EspressoServerInvalidFormatError { 
    constructor(code="Ex00003", message = "The data provided in the body of the HTTP request does not match the content-type provided.") {}
}

class EspressoServerModuleError {
    constructor(code="Ex00004",message = "") {}
}


/**
 * Class called by EspressoBodyParser to parse XML.
 * 
 * @class EspressoServerBodyParserXML
 */
class EspressoServerBodyParserXML {

}

/**
 * Class called by EspressoBodyParser to parse JSON.
 * 
 * @class EspressoServerBodyParserJSON
 */
class EspressoServerBodyParserJSON { 
    
    /**
     * Parses the content.
     * 
     * @param {any} body_content 
     * @memberof EspressoServerBodyParserJSON
     */
    parseContent(body_content) { 
        try {
            this.body_content = JSON.parse(body_content);
        } catch(error) {
                throw new EspressoServerInvalidFormatError();
        }
    }

    /**
     * Creates an instance of EspressoServerBodyParserJSON.
     * @param {any} body_content 
     * @memberof EspressoServerBodyParserJSON
     */
    constructor(body_content) { 
        this.body_content = {};
        this.body_content_type = "application/json";
        this.parseContent(body_content);
    }
}

/**
 * Creates a class for the incoming request.
 * 
 * @class EspressoServerIncomingRequestBody
 */
class EspressoServerIncomingRequestBody {
    
    /**
     * Parses body content of incoming request body.
     * 
     * @param {any} body 
     * @memberof EspressoServerIncomingRequestBody
     */
    parseBodyContent(body, content_type) {

        // Get the class that handles this kind of content
        var handler = this.getBodyContentHandler(content_type);

        // Call the method on that handler to parse the body.
        var handlerInstance = new handler(body);

        // Set the properties on the body object.
        this.body_content = handlerInstance.body_content;
        this.body_content_type = handlerInstance.body_content_type;
        this.body_content_raw = body;
    }

    /**
     * Gets the content handlers.
     * @memberof EspressoServerIncomingRequestBody
     */
    getBodyContentHandlers() {
        this.content_handlers = _.defaults(this.content_handlers,{
            "application/json" : EspressoServerBodyParserJSON,
            "application/xml" : EspressoServerBodyParserXML
        });
    }

    /**
     * Gets the class to parse that type of Content-Type
     * 
     * @param {any} content_type 
     * @memberof EspressoServerIncomingRequestBody
     */
    getBodyContentHandler(content_type) { 
         var handler = this.content_handlers[content_type];
         if(_.isNil(handler)) { 
             throw new EspressoServerUnsupportedMIMETypeError();
         } else { 
             return handler;
         }
    }

    /**
     * Creates an instance of EspressoServerIncomingRequestBody.
     * @param {any} body 
     * @param {any} content_type 
     * @memberof EspressoServerIncomingRequestBody
     */
    constructor(body,content_type) { 
        this.body_content = body;
        this.getBodyContentHandlers();
        this.parseBodyContent(body,content_type);
    }
}

/**
 * An incoming request.
 * @class EspressoServerIncomingRequest
 */
class EspressoServerIncomingRequest {

    /**
     * Used to default various headers for parsing by other handlers.
     * 
     * @param {any} headers 
     * @returns 
     * @memberof EspressoServerIncomingRequest
     */
    getDefaultHeaders(headers) { 
        return _.defaults(headers,{
            "content-type": "not-set" 
        });
    }

    /**
     * Parses HTTP body and request.
     * 
     * @memberof EspressoServerIncomingRequest
     */
    parseHTTPRequest() { 

        // Miscellaneous stuff we probably will rarely use.
        this.Raw = { 
            raw_headers: this._request.rawHeaders,
            raw_trailers: this._request.rawTrailers
        };

        // Header.
        this.Headers = this.getDefaultHeaders(this._request.headers);

        this.Status = { 
            code: this._request.url,
            message: this._request.url
        };

        this.Route = { 
            path: this._request.url,
            method: this._request.method
        };

        // Stuff from Node HTTP.
        this.ClientInstance = this._request.client;
        this.ConnectionInstance = this._request.connection;
        this.SocketInstance = this._request.socket;

    }

    /**
     * Creates an instance of EspressoServerIncomingRequest.
     * @param {any} NodeHTTPRequest 
     * @param {any} body 
     * @memberof EspressoServerIncomingRequest
     */
    constructor(NodeHTTPRequest,body) {
        this._request = NodeHTTPRequest;
        this.parseHTTPRequest(NodeHTTPRequest);
        this.Body = new EspressoServerIncomingRequestBody(body,this.Headers["content-type"]);
        this.Raw.raw_body = this.Body.body_content_raw;
    }
}

/**
 * Responds.
 * @class EspressoServerResponse
 */
class EspressoServerOutgoingRequest { 

    /**
     * Sets the status code that will be returned to the user.
     */    
    setStatusCode (val) { 
        this._statusCode = val;
    }

    /**
     * Append to the headers sent to the client.
     * 
     * @param {any} headers 
     * @memberof EspressoServerOutgoingRequest
     */
    appendHeaders(headers) {
        this._headers = _.merge(this._headers,headers);
    }

    /**
     * Sets the content-type of the content.
     * 
     * @param {any} content_type 
     * @memberof EspressoServerOutgoingRequest
     */
    setContentType(content_type){
        this.appendHeaders({
            "Content-Type":  content_type
        });
    }

    /**
     * Adds content to be sent back. 
     * @param {any} content 
     * @memberof EspressoServerOutgoingRequest
     */
    addContent(content) {
        if(_.isObject(this._content)) {
            this._content = _.merge(this._content,content);
        } else {
            this.content += content;
        }
    }

    /**
     * Sends response to the end client.
     * TODO : Remove this, modules should not send responses themselves.
     * 
     * @memberof EspressoServerOutgoingRequest
     */
    sendResponse() {
        this.responseObject.writeHead(this._statusCode,this._headers);
        
        // If the content is an object, return stringified.
        if(_.isObject(this._content)) { 
            this.responseObject.write(JSON.stringify(this._content));
        } else {
            this.responseObject.write(this._content);
        }
        this.responseObject.end();
    }
    
    /**
     * Creates an instance of EspressoServerOutgoingRequest.
     * @param {any} response 
     * @memberof EspressoServerOutgoingRequest
     */
    constructor(response) { 
        this._content = {};
        this._headers = {
            "Content-Type": "application/json"
        };
        this._statusCode = 200;
        this.responseObject = response;
    }
}

/**
 * A response
 * @class EspressoServerResponse
 */
class EspressoServerResponse {

    /**
     * Sets the status code for the response.
     * 
     * @memberof EspressoServerResponse
     */
    statusCode(status_code) {  
        this.response.setStatusCode(status_code);
        return this;
    }

    /**
     * Sets headers for response.
     * 
     * @param {any} headers 
     * @returns 
     * @memberof EspressoServerResponse
     */
    headers(headers) { 
        this.response.appendHeaders(headers);
        return this;
    }

    /**
     * Adds content for the response to send. 
     * 
     * @param {any} content 
     * @memberof EspressoServerResponse
     */
    content(content) {
        this.response.addContent(content);
        return this;
    }

    /**
     * Sets content type
     * 
     * @param {any} content_type 
     * @memberof EspressoServerResponse
     */
    contentType(content_type) {
        this.response.setContentType(content_type);
        return this;
    }

    /**
     * Shorthand function for setting the response in a module.
     * NOTE: Consider deprecating before release, is slow.
     * 
     * @param {any} response_object 
     * @memberof EspressoServerResponse
     */
    set(response_object) {
        response_object = _.defaults(response_object,{
            statusCode: 200,
            contentType: "application/json",
            headers: {},
            content: {}
        });

        // Sets all properties at once.
        this.response.setStatusCode(response_object.statusCode);
        this.response.setContentType(response_object.contentType);
        this.response.appendHeaders(response_object.headers);
        this.response.addContent(response_object.content);
    }

    /**
     * Sends response to end client.
     * 
     * @memberof EspressoServerResponse
     */
    sendResponse() {
        this.response.sendResponse();
    }

    /**
     * Creates an instance of EspressoServerResponse.
     * @param {any} NodeHTTPResponse 
     * @memberof EspressoServerResponse
     */
    constructor(request, response) { 
        this.request = request;
        this.response = response;
    }
}


/**
 * An instance of a server which handles incoming and etc.
 * @class EspressoServerInstance
 */
class EspressoServerInstance {
    /**
     * Creates an observable for the server instance.
     * 
     * @param {any} options 
     * @memberof EspressoServerInstance
     */
    _createServerInstance(options) {    
            this.server_options = options;
            this._serverInstance = http.createServer();

            /**
             * Observable for requests incoming.
             */
            this.onRequestObservable$ = Rx.Observable.create((reqObserve)=>{
                let body = [],
                    bodyContent = [],
                    end = false;

                this._serverInstance.on("request",(request,response)=>{
                    request.on("data",(chunk)=>{
                        body.push(chunk);
                    }).on("end",() => {     
                        bodyContent = Buffer.concat(body).toString();
                        end = true;     
                        reqObserve.next(
                            new EspressoServerResponse(
                                new EspressoServerIncomingRequest(request,bodyContent),
                                new EspressoServerOutgoingRequest(response)
                            )
                        );
                    });
                    setTimeout(()=>{
                        body = [];
                        if(!end) { 
                            throw new EspressoServerTimeoutError();
                        }
                    },this.server_options.default_timeout);
                });
            });

            /**
             * Observable for any errors coming through.
             */
            this.onErrorObservable$ = Rx.Observable.create((reqObserve)=>{
                this._serverInstance.on("error",(error)=>{
                    reqObserve.next(error);
                });
            });

            /**
             * Listener instance.
             */
            this.onListenObservable$ = Rx.Observable.create((reqObserve)=>{
                this._serverInstance.on("listening",(listener)=>{
                    reqObserve.next(listener);
                });
            });
  }

    /**
     * Start the server.
     * 
     * @memberof EspressoServerInstance
     */
    start () {
        if(!_.isNil(this._serverInstance)) {
            this._serverInstance.listen(this.server_options);
        }
    }

    /**
     * Creates an instance of EspressoServerInstance.
     * @memberof EspressoServerInstance
     */
    constructor(options) {
        this._createServerInstance(options);
    }
}

/**
 * Individual route item for routing traffic.
 * 
 * @class EspressoServerRouteItem
 */
class EspressoServerRouteItem {

    /**
     * Tells the router if the route matches.
     * 
     * @param {any} route_string 
     * @memberof EspressoServerRouteItem
     */
    matchRoute(route_string) {

    }

    /**
     * Parses a route item.
     * 
     * @memberof EspressoServerRouteItem
     */
    parseRoute() { 
        // Matches paths which have parameters in them.
        var pathRegex = /(\/(\w+)\/){1}((\w+|{\w+}\/?){0,})[\/]?/ig;

        // Gets the path.
        var pathMatches = pathRegex.exec(this.path);

        var x = "y";
    }

    /*
        Routes:
            /route/{named_param}/{named_param}

    */


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
    }
}

/**
 * Defines routes for a given ServerInstance
 * 
 * @class EspressoServerRoutes
 */
class EspressoServerRoutes {
    
    /**
     * Parse routes.
     * 
     * @param {any} route_object 
     * @memberof EspressoServerRoutes
     */
    setRoutes(route_array) {
        this._routes  = _.filter(route_object,(route_item)=>{
            if(route instanceof EspressoServerRouteItem) { 
                return route_item;
            }
        });
    }


    /**
     * Creates an instance of EspressoServerRoutes.
     * @param {any} route_array 
     * @memberof EspressoServerRoutes
     */
    constructor() {
        this._routes = [];
    }
}

/**
 * A module that is loaded into an EspressoServer.
 * 
 * @class EspressoServerModule
 */
class EspressoServerModule { 
    
    /**
     * Runs the action.
     * 
     * @memberof EspressoServerModule
     */
    runAction(server_response){
        var act = this.action(server_response); // If function doesn't return, it'll timeout, and do nothing. 
        act._content = this._content;
        return act;
    }

    /**
     * Creates an instance of EspressoServerModule.
     * @param {any} name 
     * @param {string} [stage="beforeResponse"] 
     * @param {any} [action=()=>{}] 
     * @memberof EspressoServerModule
     */
    constructor(
        name,
        stage = "beforeResponse",
        action = ()=>{} // beforeResponse, afterResponse
    ) {
        this.name = name;
        this.stage = stage;
        this.action = action;
    }
}


/**
 * Contains the EspressoServerInstance and handles observables.
 * @class EspressoServer
 */
class EspressoServer {
   
    /**
     * Default error handler.
     * 
     * @memberof EspressoServer
     */
    handleError(error,module_name,stage) {
        var err =  new EspressoServerModuleError();
        err.message = `Module '${module_name}' threw error at stage '${stage}' with error: ${error.message}`;
        err.stack = error.stack;
        return err;
    }

    /**
     * Starts the server.
     * 
     * @memberof EspressoServer
     */
    start() {
        this._server_instance.start();
    }

    /**
     * Runs modules for a given stage.
     * 
     * @param {any} server_response 
     * @memberof EspressoServer
     */
    runModules(server_response,stage) {
        var output = [];
        output.push(server_response);

        var modules = _.clone(this.enabled_modules);
        modules = _.isArray(modules) ? modules : [modules];

        var applicable = _.filter(modules,(module)=>{
            return module.stage == stage;
        });
        
        if(applicable.length ==0) return server_response;

        _.each(applicable,(module)=>{
            var last_output = output[output.length-1],
                stop = false;

            // For any failed modules.
            setTimeout(()=>{
                applicable = [];
                stop = true;
            },this.options.default_module_timeout);
            try {
                var actionReturn = module.runAction(last_output);
                output.push(actionReturn);
            } catch (ThrownError) {
                // Throw away the rest of the stack, we encountered an error
                applicable = [];
                stop = true;
                output = this.handleError(ThrownError,module.name,stage);
            }
        });
        
        return output;
    }

    /**
     * Runs route matching.
     * @memberof EspressoServer
     */
    runRoutes() {
        var availableRoutes = _.filter(this._router_instance._routes,(route)=>{
            var x = "y";
            return route.parseRoute();
        });

        var x = "y";
    }

    /**
     * Sends response (wrapper)
     * 
     * @param {any} resp 
     * @memberof EspressoServer
     */
    sendResponse(resp) {
        resp.response.sendResponse();
    }

    /**
     * Runs modules at various stages.
     * 
     * @param {any} server_response 
     * @returns 
     * @memberof EspressoServer
     */
    runModuleLifecycle(server_response) { 
        var cycles = ["beforeResponse","afterResponse"],
            resp = server_response;

        _.each(cycles,(cycle,iteration)=>{
            var moduleRes = this.runModules(resp,cycle);
            resp = iteration == 0 ? server_response : moduleRes;
        });

        return resp;
    }

   /**
     * Returns server options
     * 
     * @param {any} options 
     * @returns 
     * @memberof EspressoServerInstance
     */
    getDefaultOptions(options) {
        return _.defaults(options,{
            host: 'localhost',
            default_timeout: 30000,
            default_module_timeout: 30000,

            // Todo - Add in policy restriction
            content_policy: { 
                content_types_supported: [
                    "application/json",
                    "application/xml"
                ]
            },
            // Todo - Add in security restriction 
            security_policy: {
                content_types_allowed: []
            },  
            port: 80,
            exclusive: false
        }); 
    }


    /**
     * Handles observers from the parent instance.
     * 
     * @memberof EspressoServer
     */
    handleObservers() { 
        this._server_instance.onListenObservable$.subscribe(
            (listen) => {
                console.log(listen);
            },
            (other) => { 
                console.log(other);
            },
            () => {
                this.handleError();
            }
        );
        this._server_instance.onRequestObservable$.subscribe(
            (listen) => {
                // Process modules
                var resp = this.runModuleLifecycle(listen);

                // Process routing.
                this.runRoutes();

                // Send responses.
                this.sendResponse(resp);
            },
            (other) => { 
                console.log(other);
            },
            () => {
                this.handleError();
            }
        );

        this._server_instance.onErrorObservable$.subscribe(
            (listen) => {
                console.log(listen);
            },
            (other) => { 
                console.log(other);
            },
            () => {
                this.handleError();
            }
        );
    }

    /**
     * Registers modules to run through. 
     * 
     * @memberof EspressoServer
     */
    modules(modules) {
        if(!_.isArray(modules)) {
            modules = [modules];
        }
        this.enabled_modules = _.reduce(modules,(result,module)=>{
            result = _.isArray(result) ? result : [];
            // So as not to expose any of the class crapola to the user.
            if(module instanceof EspressoServerModule) { 
                result.push(module);
                return result;
            } else {
                return result;
            }
        });
        return this;
    }

    /**
     * Sets routes on the router.
     * 
     * @memberof EspressoServer
     */
    routes(routes) {

        // Routes
        var _routes = [];

        // Loop routes
        _.each(routes,(route)=>{
            if(!(route instanceof EspressoServerRouteItem) && _.isObject(route)) { 
                if(_.isNil(route.path) == false && _.isNil(route.method) == false && _.isNil(route.format) == false && _.isNil(route.handler) == false) { 
                    var path_requirements = _.isNil(route.path_requirements) ? {} : path_requirements;
                    _routes.push(new EspressoServerRouteItem(route.path,route.method,route.format,route.handler,path_requirements));   
                }
            } else if((route instanceof EspressoServerRouteItem)) { 
                _routes.push(route);
            } else { 
                return false;
            }    
        });
        this._router_instance._routes = _routes;       
 
        return this;
    }

    /**
     * Creates an instance of EspressoServer.
     * @param {any} options 
     * @memberof EspressoServer
     */
    constructor(options) {
        this.options = this.getDefaultOptions(options);
        this.enabled_modules = [];
        this._server_instance = new EspressoServerInstance(this.options);
        this._router_instance = new EspressoServerRoutes();
        this.handleObservers();
    }
}


module.exports.EspressoServerModule = EspressoServerModule;
module.exports.EspressoServerInstance = EspressoServerInstance;
module.exports.EspressoServer = EspressoServer;
