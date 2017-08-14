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
    constructor(response) { 
        this.responseObject = response;
    }
}

/**
 * 

 * @class EspressoServerResponse
 */
class EspressoServerResponse {
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
 *  EspressoCore - Handles instances of EspressoServer
 *      - EspressoApp - Handles server and config
 *          - EspressoConfig - Configuration of security / etc of the app instance.     
 *          - EspressoRouter - Handles routing of paths on an individual server.
 *              - EspressoRouterRoute - GET/POST
 *                  - Routes, route parameters, route regex & typing, named error handler. 
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
     * Creates an instance of EspressoServerRouteItem.
     * @param {string} [name=""] 
     * @param {string} [path="/"] 
     * @param {string} [method="any"] 
     * @param {string} [format="json"] 
     * @param {any} [handler=() => {}] 
     * @param {any} [supported_formats=[]] 
     * @memberof EspressoServerRouteItem
     */
    constructor(
        name = "",
        path = "/",
        method = "any",
        format = "json",
        handler = () => {}
    ) {
        this.name = name;
        this.path = path;
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
    parseRoutes(route_array) {
        this.routes  = _.filter(route_object,(route_item)=>{
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
    constructor(route_array) {
        this.parseRoutes(route_array);
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
        return this.action(server_response); // If function doesn't return, it'll timeout, and do nothing. 
    }
    
    
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
    handleError() {}

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

        _.each(_.filter(this.modules,(module)=>{
            return module.stage == stage;
        }),(module)=>{
            var last_output = output[output.length-1],
                stop = false;

            // For any failed modules.
            setTimeout(()=>{
                stop = true;
            },this.options.default_module_timeout);

            var actionReturn = module.runAction(last_output);
            output.push(actionReturn);
        });

        return output;
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
                var mods = this.runModules(listen,"beforeResponse");
                listen.response.responseObject.writeHead(200,{
                    'Content-Type': 'text/plain'
                });
                listen.response.responseObject.write("Fuck off mate");
                listen.response.responseObject.end();
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
        this.modules = _.reduce(modules,(result,module)=>{
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
     * Creates an instance of EspressoServer.
     * @param {any} options 
     * @memberof EspressoServer
     */
    constructor(options) {
        this.options = this.getDefaultOptions(options);
        this._server_instance = new EspressoServerInstance(this.options);
        this.handleObservers();
    }
}





module.exports.EspressoServerModule = EspressoServerModule;
module.exports.EspressoServerInstance = EspressoServerInstance;
module.exports.EspressoServer = EspressoServer;
