
const EspressoErrorCodeInvalidLogger = '0x0001';
const EspressoErrorCodeFileSystemError = '0x0002';

// Map with error messages in it.
let EspressoErrorMessages = new Map();


class EspressoErrorRouteTimeout extends Error {
  /**
   * Creates an instance of EspressoErrorRouteTimeout.
   * @param {any} [context=null] The error context.
   * @memberof EspressoErrorRouteTimeout
   */
  constructor(context = null) {
    super();
    this.code = EspressoErrorCodeInvalidLogger;
    this.message = EspressoErrorMessages.get(EspressoErrorCodeInvalidLogger);
    this.context = context;
  }
}

/**
 * An error if the route action is invalid.
 *
 * @class EspressoErrorInvalidRouteAction
 * @extends {Error}
 */
class EspressoErrorInvalidRouteAction extends Error {
  /**
   * Creates an instance of EspressoInvalidLoggerError.
   * @param {any} context The context of the error. (Stack trace)
   * @memberof EspressoInvalidLoggerError
   */
  constructor(context = null) {
    super();
    this.code = EspressoErrorCodeInvalidLogger;
    this.message = EspressoErrorMessages.get(EspressoErrorCodeInvalidLogger);
    this.context = context;
  }
}

/**
 * Route parameters passed are invalid.
 *
 * @class EspressoErrorInvalidRouteParameters
 * @extends {Error}
 */
class EspressoErrorInvalidRouteParameters extends Error {
  /**
   * Creates an instance of EspressoInvalidLoggerError.
   * @param {any} context The context of the error. (Stack trace)
   * @memberof EspressoInvalidLoggerError
   */
  constructor(context) {
    super();
    this.code = EspressoErrorCodeInvalidLogger;
    this.message = EspressoErrorMessages.get(EspressoErrorCodeInvalidLogger);
    this.context = context;
  }
}

/**
 * Error for when the logger provided is in an invalid format.
 *
 * @class EspressoInvalidLoggerError
 * @extends {Error}
 */
class EspressoInvalidLoggerError extends Error {
  /**
   * Creates an instance of EspressoInvalidLoggerError.
   * @param {any} context The context of the error. (Stack trace)
   * @memberof EspressoInvalidLoggerError
   */
  constructor(context) {
    super();
    this.code = EspressoErrorCodeInvalidLogger;
    this.message = EspressoErrorMessages.get(EspressoErrorCodeInvalidLogger);
    this.context = context;
  }
}

/**
 * Generic espresso filesystem error.
 *
 * @class EspressoFileSystemError
 * @extends {Error}
 */
class EspressoFileSystemError extends Error {
  /**
   * Creates an instance of EspressoFileSystemError.
   * @param {any} context The context (stack trace)
   * @memberof EspressoFileSystemError
   */
  constructor(context) {
    super();
    this.code = EspressoErrorCodeFileSystemError;
    this.message = EspressoErrorMessages.get(EspressoErrorCodeFileSystemError);
    this.context = context;
  }
}

EspressoErrorMessages = new Map([
  [EspressoErrorCodeInvalidLogger, 'The logger provided is does not correctly implement the EspressoLogger class. '],
  [EspressoErrorCodeFileSystemError, 'There was an error trying to perform a file operation upon a file or folder.'],
  [EspressoErrorInvalidRouteParameters, 'The parameters for the route provided are invalid. Please ensure each item is set correctly in the route options.'],
  [EspressoErrorInvalidRouteAction, 'The action provided for the route is invalid - actions must be functions which can be called by Espresso when routing.'],
  [EspressoErrorRouteTimeout, 'The route request timed out. Please ensure that any observables within your route or async functions complete. If the timeout is too short, please increase the timeout in EspressoRouteOptions']
]);

module.exports = {
  EspressoErrorInvalidRouteAction,
  EspressoErrorInvalidRouteParameters,
  EspressoFileSystemError,
  EspressoInvalidLoggerError,
  EspressoErrorRouteTimeout
};
