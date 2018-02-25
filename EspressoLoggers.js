/* eslint no-console: 0 */
const {
  EspressoLogOutputFile,
  EspressoLogOutputFileRotating,
  EspressoLogOutputConsole
} = require('./EspressoConst');

const { EspressoFileSystemError } = require('./EspressoErrors');

const {
  createLogger,
  format,
  transports
} = require('winston');

const {
  combine,
  simple,
  colorize
} = format;

const defaults = require('lodash/defaults');
const { ensureDir } = require('fs-extra');

/**
 * An individual logger item.
 *
 * @class EspressoLoggerItem
 */
class EspressoLoggerItem {
  /**
   * Output types that use files.
   *
   * @readonly
   * @memberof EspressoLoggerItem
   */
  get fileOutputTypes() {
    return [
      EspressoLogOutputFile,
      EspressoLogOutputFileRotating
    ];
  }

  /**
   * Default file name for log files if options aren't set.
   *
   * @readonly
   * @memberof EspressoLoggerItem
   */
  get defaultFileName() {
    return 'espresso_default.log';
  }

  /**
   * Get the default log folder.
   *
   * @readonly
   * @memberof EspressoLoggerItem
   */
  get defaultLogFolder() {
    return 'logs';
  }

  /**
   * Gets the default log file directory.
   *
   * @readonly
   * @memberof EspressoLoggerItem
   */
  get defaultLogPath() {
    return `${this.defaultLogFolder}/${this.defaultFileName}`;
  }

  /**
   * Get default winston parameters.
   *
   * @readonly
   * @memberof EspressoLoggerItem
   */
  get defaultWinstonParameters() {
    return {
      silent: false,
      timestamp: true,
      stringify: false,
      prettyPrint: true
    };
  }

  /**
   * Sets the default options for the logger based upon type.
   *
   * @param {any} options The options passed to constructor.
   * @returns {object} Array of options.
   * @memberof EspressoLoggerItem
   */
  defaultOptions(options) {
    const opts = {};
    const isFile = this.fileOutputTypes.indexOf(this.type) !== -1;

    // If it's a file, it needs a log path.
    if (isFile) {
      opts.filename = this.defaultLogPath;
    } else {
      opts.colorize = true;
    }

    // Default the options
    return defaults(opts, options);
  }

  /**
   * Ensure the log directory exists.
   * Note: Due to winston issue, this is a workaround.
   *
   * @memberof EspressoLoggerItem
   * @returns {void}
   */
  ensureLogDirExists() {
    ensureDir(this.defaultLogFolder).catch((error) => {
      throw new EspressoFileSystemError(error);
    });
  }

  /**
   * Adds options to the internal winston options.
   *
   * @param {any} options The options to add.
   * @memberof EspressoLoggerItem
   * @returns {void}
   */
  addOptions(options) {
    this.options = defaults(
      options,
      this.defaultOptions(this.defaultWinstonParameters)
    );
    this.ensureLogDirExists();
  }

  /**
   * Get the transport.
   *
   * @memberof EspressoLoggerItem
   */
  get transport() {
    return this.Transport || new transports.Console(this.options);
  }

  /**
   * Set the transport instance.
   *
   * @param {object} val The value to set.
   * @memberof EspressoLoggerItem
   * @returns {void}
   */
  set transport(val) {
    this.Transport = val;
  }

  /**
   * Create the transport.
   *
   * @memberof EspressoLoggerItem
   * @returns {void}
   */
  createTransport() {
    if (this.type === EspressoLogOutputFile) {
      this.transport = new transports.File(this.options);
    }

    if (this.type === EspressoLogOutputFileRotating) {
      this.transport = new transports.DailyRotateFile(this.options);
    }

    if (this.type === EspressoLogOutputConsole) {
      this.transport = new transports.Console(this.options);
    }
  }

  /**
   * Creates an instance of EspressoLoggerItem.
   * @param {any} type The type of logger.
   * @memberof EspressoLoggerItem
   * @returns {void}
   */
  constructor(type) {
    this.type = type;
    this.addOptions({});
    this.createTransport();
  }
}

/**
 * Handles multiple instances of logging.
 *
 * @class EspressoLogger
 */
class EspressoLogger {
  /**
   * Adds loggers to the logger.
   *
   * @param {any} loggers Loggers to add.
   * @memberof EspressoLogger
   * @returns {void}
   */
  addLoggers(loggers) {
    this.loggerTransports = loggers.map(logger => logger.Transport);
  }

  /**
   * Log information to file or console.
   *
   * @param {any} message The message to log.
   * @memberof EspressoLogger
   * @returns {void}
   */
  logInfo(message) {
    this.log(message, 'info');
  }

  /**
   * Log error.
   *
   * @param {any} message The message to log.
   * @memberof EspressoLogger
   * @returns {void}
   */
  logError(message) {
    this.log(message, 'error');
  }

  /**
   * Log a warning message.
   *
   * @param {any} message The message to log.
   * @memberof EspressoLogger
   * @returns {void}
   */
  logWarn(message) {
    this.log(message, 'warn');
  }

  /**
   * Logs a message to the transport.
   *
   * @param {any} logMessage The log message.
   * @param {any} level The level of the message.
   * @memberof EspressoLogger
   * @returns {void}
   */
  log(logMessage, level) {
    const message = `${new Date().toISOString()} - ${logMessage}`;
    this.loggerInstance.log({
      message,
      level
    });
  }

  /**
   * Creates a logger instance.
   *
   * @memberof EspressoLogger
   * @returns {void}
   */
  createLoggerInstance() {
    this.loggerInstance = createLogger({
      format: combine(
        colorize(),
        simple()
      ),
      transports: this.loggerTransports
    });
  }

  /**
   * Creates an instance of EspressoLogger.
   * @param {any} loggers Loggers to add.
   * @memberof EspressoLogger
   */
  constructor(loggers) {
    this.addLoggers(loggers);
  }
}

module.exports = {
  EspressoLoggerItem,
  EspressoLogger
};
