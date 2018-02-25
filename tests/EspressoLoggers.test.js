/* eslint no-undef: 0 */
const { EspressoLoggerItem, EspressoLogger } = require('./../EspressoLoggers');
const { EspressoLogOutputFile } = require('./../EspressoConst');

describe('EspressoLogger - Test logging works!', () => {
  test('Logger initialises propertly with winston defaults', () => {
    const log2 = new EspressoLoggerItem(EspressoLogOutputFile);
    const logger = new EspressoLogger([log2]);
    logger.createLoggerInstance();
    logger.logInfo('Testing');
  });
});
