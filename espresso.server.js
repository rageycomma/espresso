const   http = require("http"),
        Rx = require("rxjs/Rx"),
        Observable = Rx.Observable,
        Subject = Rx.Subject,
        _ = require("lodash");

const   Parsers = require("./espresso.parsers"),
        Router = require("./espresso.router"),
        Errors = require("./espresso.errors");

const   EspressoServerBodyParserJSON = Parsers.EspressoServerBodyParserJSON,
        EspressoServerBodyParserXML = Parsers.EspressoServerBodyParserXML,
        EspressoRouter = Router.EspressoRouter;

const   EspressoServerInvalidFormatError = Errors.EspressoServerInvalidFormatError,
        EspressoServerModuleError = Errors.EspressoServerModuleError,
        EspressoServerTimeoutError = Errors.EspressoServerTimeoutError,
        EspressoServerUnsupportedMIMETypeError = Errors.EspressoServerUnsupportedMIMETypeError,
        EspressoServerNoActionError = Errors.EspressoServerNoActionError,
        EspressoServerInvalidParametersError = Errors.EspressoServerInvalidParametersError;

// Success
module.exports.EspressoServerHttpStatuses  = new Map([

    // 2xx - OK
    ['OK',200],
    ['Created',201],
    ['Accepted',202],
    ['NonAuthInformation',203],
    ['NoContent',204],
    ['ResetContent',205],
    ['PartialContent',206],
    ['MultiStatus',207],
    ['AlreadyReported',208],
    ['IMUsed',226],

    // 3xx - Redirect
    ['MultipleChoices',300],
    ['MovedPermanently',301],
    ['Found',302],
    ['SeeOther',303],
    ['NotModified',304],
    ['UseProxy',305],
    ['TemporaryRedirect',307],
    ['PermanentRedirect',308],

    // 4xx - Client Errors
    ['BadRequest',400],
    ['Unauthorized',401],
    ['PaymentRequired',402],
    ['Forbidden',403],
    ['NotFound',404],
    ['MethodNotAllowed',405],
    ['NotAcceptable',406],
    ['ProxyAuthRequired',407],
    ['Timeout',408],
    ['Conflict',409],
    ['Gone',410],
    ['LengthRequired',411],
    ['PreconditionFailed',412],
    ['PayloadTooLarge',413],
    ['URITooLong',414],
    ['UnsupportedMediaType',415],
    ['RangeNotSatisfiable',416],
    ['ExpectationFailed',417],
    ['ImATeapot',418],
    ['MisdirectedRequest',421],
    ['Unprocessable',422],
    ['Locked',423],
    ['FailedDependency',424],
    ['UpgradeRequired',426],
    ['PreconditionRequired',428],
    ['TooManyRequests',429],
    ['HeaderFieldsTooLarge',431],
    ['UnavailableLegalReasons',451],

    // 5xx - Server errors
    ['InternalServerError',500],
    ['NotImplemented',501],
    ['BadGateway',502],
    ['ServiceUnavailable',503],
    ['GatewayTimeout',504],
    ['HTTPVersionUnsupported',505],
    ['InsufficientStorage',507],
    ['LoopDetected',508],
    ['NotExtended',510],
    ['NetworkAuthRequired',511],

    // Espresso lame-o codes.
    ['Squanchy',112]
]);


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
 * Incoming route item
 * 
 * @class EspressoServerIncomingRouteItem
 */
class EspressoServerIncomingRouteItem {
    
    /**
     * Parse the route coming in.
     * 
     * @memberof EspressoServerIncomingRouteItem
     */
    parseRoute() {
        if(this.path.substring(0,1)!="/") {
            throw new EspressoServerInvalidFormatError();
        } else { 
            this._path = this.path.substring(1,this.path.length).split("/");
        }
    }

    /**
     * Creates an instance of EspressoServerIncomingRouteItem.
     * @param {any} route_path 
     * @param {any} method 
     * @param {any} incoming 
     * @memberof EspressoServerIncomingRouteItem
     */
    constructor(route_path, method) { 
        this.path = route_path;
        this.method = method;
        this.parseRoute();
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

        this.Route = new EspressoServerIncomingRouteItem(
            this._request.url,
            this._request.method
        );

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
        this._content = content;
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
        Object.assign(this,_.defaults(response_object,{
            statusCode: 200,
            contentType: "application/json",
            headers: {},
            content: {}
        }));
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
 * Class containing the parameters for an espresso server instance. 
 * 
 * @class EspressoServerInstanceParameters
 */
class EspressoServerInstanceParameters { 

    /**
     * Default port number. 
     * 
     * @readonly
     * @memberof EspressoServerInstanceParameters
     */
    get DEFAULT_PORT_NUMBER() { 
        return 3000;
    }

    /**
     * Default hostname
     * 
     * @readonly
     * @memberof EspressoServerInstanceParameters
     */
    get DEFAULT_HOSTNAME() { 
        return 'localhost';
    }

    /**
     * Default timeout in milliseconds. 
     * 
     * @readonly
     * @memberof EspressoServerInstanceParameters
     */
    get DEFAULT_TIMEOUT(){
        return 500;
    }

    /**
     * Default encoding. 
     * 
     * @readonly
     * @memberof EspressoServerInstanceParameters
     */
    get DEFAULT_ENCODING() { 
        return 'utf8';
    }

    /**
     * The max headers.
     * 
     * @readonly
     * @memberof EspressoServerInstanceParameters
     */
    get DEFAULT_MAX_HEADERS() { 
        return 2000;
    }

    /**
     * The default keep alive. 
     * 
     * @readonly
     * @memberof EspressoServerInstanceParameters
     */
    get DEFAULT_KEEP_ALIVE(){
        return 1000;
    }

    /**
     * Port number set or default. 
     * 
     * @memberof EspressoServerInstanceParameters
     */
    get port() { 
        return this._port || this.DEFAULT_PORT_NUMBER;
    }

    /**
     * Set port number.
     * 
     * @memberof EspressoServerInstanceParameters
     */
    set port(port_number) { 
        this._port = port_number;
    }

    /**
     * Get set hostname or default hostname.
     * 
     * @memberof EspressoServerInstanceParameters
     */
    get hostname() { 
        return this._hostname || this.DEFAULT_HOSTNAME;
    }

    /**
     * Set hostname.
     * 
     * @memberof EspressoServerInstanceParameters
     */
    set hostname(hostname) { 
        this._hostname = hostname;
    }
 
    /**
     * Get the timeout.
     * 
     * @memberof EspressoServerInstanceParameters
     */
    get timeout() { 
        return this._timeout || this.DEFAULT_TIMEOUT;
    }

    /**
     * Set timeout. 
     * 
     * @memberof EspressoServerInstanceParameters
     */
    set timeout(timeout) { 
        this._timeout = timeout; 
    }

    /**
     * Gets encoding or default. 
     * 
     * @readonly
     * @memberof EspressoServerInstanceParameters
     */
    get encoding() { 
        return this._encoding || this.DEFAULT_ENCODING;
    }

    /**
     * Sets encoding. 
     * 
     * @memberof EspressoServerInstanceParameters
     */
    set encoding(encoding) { 
        if(Buffer.isEncoding(encoding)) { 
            this._encoding = encoding; 
        } else { 
            this._encoding = this.DEFAULT_ENCODING;
        }
    }

    /**
     * Get the max headers. 
     * 
     * @readonly
     * @memberof EspressoServerInstanceParameters
     */
    get max_headers() { 
        return this._max_headers || this.DEFAULT_MAX_HEADERS; 
    }

    /**
     * Sets the max headers. 
     * 
     * @memberof EspressoServerInstanceParameters
     */
    set max_headers(max_headers){ 
        this._max_headers = max_headers;
    }

    /**
     * Gets keep alive time. 
     * 
     * @readonly
     * @memberof EspressoServerInstanceParameters
     */
    get keep_alive() {
        return this._keep_alive || this.DEFAULT_KEEP_ALIVE;
    }

    /**
     * Sets the keep alive. s
     * 
     * @memberof EspressoServerInstanceParameters
     */
    set keep_alive(keep_alive) { 
        this._keep_alive = keep_alive;
    }

    /**
     * Creates an instance of EspressoServerInstanceParameters.
     * @param {object} [parameters={}] 
     * @memberof EspressoServerInstanceParameters
     */
    constructor(parameters = {}) { 
        Object.assign(this,parameters);
    }
}

/**
 * An instance of Espresso, bound to a Node HTTP instance and observable. 
 * 
 * @class EspressoServerInstance
 */
class EspressoServerInstance { 

    setServerInstanceOptions() {
        this.serverInstance.maxHeadersCount = this._options.max_headers;
        this.serverInstance.keepAliveTimeout = this._options.keep_alive;
    }

    createServerInstance() { 
        this.serverInstance = http.createServer();
        this.setServerInstanceOptions();

        this.serverIncomingSubject = new Subject();

        // Defer the observable so it is available 
        this.espressoServerInstance$ = Observable.defer(() => { 
            return Observable.create((espr)=>{
                this.serverInstance
                    .on("request",(req,res)=>{
                        var body = [],
                            content = '';
                        req
                            .on("data",(chunk) => body.push(chunk))
                            .on("end",()=>{
                                content = Buffer.concat(body).toString();
                                let responseObject =  new EspressoServerResponse(
                                    new EspressoServerIncomingRequest(req,content),
                                    new EspressoServerOutgoingRequest(res)
                                );
                                espr.next(responseObject);
                            });
                    })
                    .on("error",(err)=>{
                        espr.error(err);
                    });
            });
        });
        this.espressoIncomingInstance$ = this.espressoServerInstance$.multicast(()=>{
            return this.serverIncomingSubject;
        });
        this.espressoIncomingInstance$.connect();
        this._router = new EspressoRouter(this);
    }

    get isListening() { 
        return this._isListening || false;
    }

    set isListening(val) { 
        this._isListening = val;
    }

    addModule(module) { 
        if(!_.isArray(this.modules)){
            this.modules = [];
        }
        this.modules.push(module);
    }

    hasModules() { 
        return _.isArray(this.modules) && this.modules.length >0;
    }


    start() {
        if(this.hasModules()==true) {
            this.isListening = true;
            this.serverInstance.listen(this._options.port,this._options.hostname);
        } else { 
            throw new EspressoServerNoActionError();
        }
    }

    stop() {
        this.serverInstance.close();
    }
 
    constructor(parameters = {}) { 
        if(parameters instanceof EspressoServerInstanceParameters) { 
            this._options = parameters; 
        } else if(_.isObject(parameters) || _.isNil(parameters)) { 
            this._options = new EspressoServerInstanceParameters(parameters);
        } else { 
            throw new EspressoServerInvalidParametersError();
        }
        this.createServerInstance();
    }

}

module.exports.EspressoServerInstance = EspressoServerInstance;
module.exports.EspressoServerInstanceParameters = EspressoServerInstanceParameters;