
const http = require('http');

const { EspressoChange } = require('./EspressoCommon');

const { BehaviorSubject } = require('rxjs');

/**
 * Options to be provided for starting the http server.
 *
 * @class EspressoHttpWrapperOptions
 */
class EspressoHttpWrapperOptions {
  /**
   * Sets the number of max listeners.
   * @param {number} val The number of max listeners.
   * @memberof EspressoHttpWrapperOptions
   */
  set maxListeners(val) {
    this.configMaxListeners = val;
  }

  /**
   * Sets the max number of headers that can be used in a HTTP request.
   * @param {number} val The max headers that can be set.
   * @memberof EspressoHttpWrapperOptions
   */
  set maxHeaders(val) {
    this.configMaxHeaders = val;
  }

  /**
   * The timeout for requests.
   *
   * @param {number} val Timeout in ms.
   * @memberof EspressoHttpWrapperOptions
   */
  set timeout(val) {
    this.configTimeout = val;
  }

  /**
   * Sets the keepAlive timeout.
   * @param {number} val The value in ms of the keepalive for a connection.
   * @memberof EspressoHttpWrapperOptions
   */
  set keepAliveTimeout(val) {
    this.configKeepAliveTimeout = val;
  }

  /**
   * The hostname to listen on.
   * @param {string} val The hostname.
   * @memberof EspressoHttpWrapperOptions
   */
  set hostName(val) {
    this.configHostName = val;
  }

  /**
   * The port to bind this to.
   * @param {number} val The port number for the espresso server to listen on.
   * @memberof EspressoHttpWrapperOptions
   */
  set port(val) {
    this.configPort = val;
  }

  /**
   * Get the port.
   *
   * @memberof EspressoHttpWrapperOptions
   */
  get port() {
    return this.configPort;
  }

  /**
   * Get hostname.
   *
   * @memberof EspressoHttpWrapperOptions
   */
  get hostName() {
    return this.configHostName;
  }

  /**
   * Get the keep alive timeout.
   *
   * @memberof EspressoHttpWrapperOptions
   */
  get keepAliveTimeout() {
    return this.configKeepAliveTimeout;
  }

  /**
   * Get max headers.
   *
   * @memberof EspressoHttpWrapperOptions
   */
  get maxHeaders() {
    return this.configMaxHeaders;
  }

  /**
   * Get max listeners.
   *
   * @memberof EspressoHttpWrapperOptions
   */
  get maxListeners() {
    return this.configMaxHeaders;
  }

  /**
 * Creates an instance of EspressoHttpWrapperOptions.
 * @param {object} params The parameters to be assigned to this option instance.
 * @memberof EspressoHttpWrapperOptions
 */
  constructor(params) {
    Object.assign(this, params);
  }
}

/**
 * Wrapper for headers to be added to Node HTTP classes.
 *
 * @class EspressoHttpWrapperHeaders
 */
class EspressoHttpWrapperHeaders {
  /**
   * Creates a change object.
   *
   * @param {any} changeType The type of change.
   * @param {any} currentValue The current value of the changed item.
   * @param {any} previousValue The previous value of the changed item.
   * @memberof EspressoHttpWrapperHeaders
   * @returns {EspressoChange} An espresso change object.
   */
  createChange(changeType, currentValue, previousValue) {
    return new EspressoChange(changeType, currentValue, previousValue);
  }

  /**
   * Add a header to the headers list.
   *
   * @param {any} headerText The header field.
   * @param {any} headerValue The value of the header field.
   * @memberof EspressoHttpWrapperHeaders
   * @returns {void}
   */
  addHeader(headerText, headerValue) {
    const change = this.createChange('addHeader', [headerText, this.headers.get(headerText)], [headerText, headerValue]);
    this.headers.set(headerText, headerValue);
    this.headersChanged$.next(change);
  }

  /**
   * Set the headers as an array. Completely resets the array.
   *
   * @param {any} headerArray The array of header fields.
   * @memberof EspressoHttpWrapperHeaders
   * @returns {void}
   */
  addHeaders(headerArray) {
    const change = this.createChange('addHeaders', this.headers.values.headerArray);
    this.headers = new Map(headerArray);
    this.headersChanged$.next(change);
  }

  /**
   * Remove a header.
   *
   * @param {any} headerText The header item to remove.
   * @memberof EspressoHttpWrapperHeaders
   * @returns {void}
   */
  removeHeader(headerText) {
    const change = this.createChange('removeHeader', [headerText, this.headers.get(headerText)], null);
    this.headers.delete(headerText);
    this.headersChanged$.next(change);
  }

  /**
   * Resets the headers in the map.
   *
   * @memberof EspressoHttpWrapperHeaders
   * @returns {void}
   */
  resetHeaders() {
    const change = this.createChange('resetHeaders', this.headers.values, null);
    this.headers = new Map();
    this.headersChanged$.next(change);
  }

  /**
   * Subscribe to when headers added.
   *
   * @memberof EspressoHttpWrapperHeaders
   * @returns {Observable} An observable expressing the changes in headers.
   */
  onHeadersAdded() {
    return this.headersChanged$;
  }

  /**
   * Initialise the stuff this needs to function.
   *
   * @memberof EspressoHttpWrapperHeaders
   * @returns {void}
   */
  init() {
    // Create a new map for the headers.
    this.headers = new Map();

    // Create subject for headers added.
    this.headersChanged$ = new BehaviorSubject(new EspressoChange());
  }

  /**
   * Creates an instance of EspressoHttpWrapperHeaders.
   * @memberof EspressoHttpWrapperHeaders
   */
  constructor() {
    this.init();
  }
}

/**
 * Provides a condensed, hidden form of request. Sit back, relax, let espresso do it.
 *
 * @class EspressoHttpWrapperRequest
 */
class EspressoHttpWrapperRequest {
  constructor(request, response) {
    this.request = request;
    this.response = response;
  }
}

/**
 * Contains content received from the client.
 *
 * @class EspresoHttpWrapperContent
 */
class EspresoHttpWrapperIncomingContent {
  /**
   * Creates an instance of EspresoHttpWrapperContent.
   * @param {any} content The content.
   * @param {any} contentType The type of the content.
   * @memberof EspresoHttpWrapperContent
   */
  constructor(content, contentType) {
    this.content = content;
    this.contentType = contentType;
  }
}

/**
 * HTTP Error wrapper to present in consistent espresso fashion.
 *
 * @class EspressoHttpWrapperError
 * @extends {Error}
 */
class EspressoHttpWrapperError extends Error {
  constructor(error, code = null, message = null) {
    super();
    this.error = error;
    this.code = code;
    this.message = message;
  }
}

/**
 * Wrapper for the HTTP functionality in node.
 *
 * @class EspressoHttpWrapper
 */
class EspressoHttpWrapper {
  /**
   * Register the subjects which will be subscribed to.
   *
   * @memberof EspressoHttpWrapper
   * @returns {void}
   */
  registerSubjects() {
    this.onCloseSubject$ = new BehaviorSubject(new EspressoHttpWrapperRequest());
    this.onConnectSubject$ = new BehaviorSubject(new EspressoHttpWrapperRequest());
    this.onConnectionSubject$ = new BehaviorSubject(new EspressoHttpWrapperRequest());
    this.onContinueSubject$ = new BehaviorSubject(new EspressoHttpWrapperRequest());
    this.onExpectationSubject$ = new BehaviorSubject(new EspressoHttpWrapperRequest());
    this.onErrorSubject$ = new BehaviorSubject(new EspressoHttpWrapperRequest());
    this.onUpgradeSubject$ = new BehaviorSubject(new EspressoHttpWrapperRequest());
    this.onDataSubject$ = new BehaviorSubject(new EspressoHttpWrapperRequest());
  }

  /**
   * Prepare the wrapper request object.
   *
   * @param {IncomingMessage} req The node HTTP request object.
   * @param {ServerResponse} res The node HTTP response object.
   * @memberof EspressoHttpWrapper
   * @returns {EspressoHttpWrapperRequest} The espresso wrapper request.
   */
  prepareWrapperRequest(req, res) {
    return new EspressoHttpWrapperRequest(req, res);
  }

  /**
   * Returns an expresso-wrapped error.
   * @param {object} error The error.
   * @memberof EspressoHttpWrapper
   * @returns {EspressoHttpWrapperError} The espresso error.
   */
  processError(error) {
    return new EspressoHttpWrapperError(error);
  }

  /**
   * Processes incoming data.
   *
   * @memberof EspressoHttpWrapper
   * @returns {void}
   */
  processIncomingData() {
    // Predefine content
    let body = [];

    // Preserve scope/
    const self = this;

    // Now wait for a request.
    this.serverInstance.on('request', (req, res) => {
      // Now subscribe to request events.
      req.on('data', (chunk) => {
        body.push(chunk);
      }).on('end', () => {
        body = Buffer.concat(body).toString();
        self.onDataSubject$.next(this.prepareWrapperRequest(req, res));
      }).on('error', (error) => {
        self.onDataSubject$.error(error);
      });
    });
  }

  /**
   * Run the server.
   *
   * @memberof EspressoHttpWrapper
   * @returns {void}
   */
  runServer() {
    // Register self.
    const self = this;

    // Register listener for connection.
    self.serverInstance
      .on('connection', (req, res) => self.onConnectionSubject$.next(self.prepareWrapperRequest(req, res)))
      .on('connect', (req, res) => self.onConnectSubject$.next(self.prepareWrapperRequest(req, res)))
      .on('checkContinue', (req, res) => self.onContinueSubject$.next(self.prepareWrapperRequest(req, res)))
      .on('close', (req, res) => self.onCloseSubject$.next(self.prepareWrapperRequest(req, res)))
      .on('upgrade', (req, res) => self.onUpgradeSubject$.next(self.prepareWrapperRequest(req, res)))
      .on('error', (req, res) => self.onErrorSubject$.next(self.prepareWrapperRequest(req, res)));

    // All registered, now we treat the data separately because it's chunked.
    self.processIncomingData();
  }

  /**
   * Initialises the server instance from node.
   *
   * @memberof EspressoHttpWrapper
   * @returns {void}
   */
  initServer() {
    // Init it without default param just for readability.
    this.serverInstance = http.createServer();

    // Now register the handlers.
    this.registerSubjects();

    // Runs node servers and registers listeners.
    this.runServer();
  }

  /**
   * Starts the server instance.
   *
   * @memberof EspressoHttpWrapper
   * @returns {void}
   */
  start() {
    this.serverInstance.listen(this.httpOptions.port);
  }

  /**
   * Creates an instance of EspressoHttpWrapper.
   * @param {object} httpOptions The options as a parameter.
   * @memberof EspressoHttpWrapper
   * @returns {void}
   */
  constructor(httpOptions) {
    this.httpOptions = httpOptions;
    this.initServer();
  }
}

module.exports = {
  EspressoHttpWrapperHeaders,
  EspressoHttpWrapperOptions,
  EspresoHttpWrapperIncomingContent,
  EspressoHttpWrapper
};
