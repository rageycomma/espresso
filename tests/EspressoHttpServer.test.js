/* eslint no-undef: 0 */
const espresso = require('./../EspressoHttpServer');

const { EspressoHttpWrapperHeaders, EspressoHttpWrapperOptions } = espresso;
const { EspressoChange } = require('../EspressoCommon');

describe('EspressoHttpWrapperHeaders - Test headers are propertly set and got.', () => {
  const headers = new EspressoHttpWrapperHeaders();

  test('Tests that subscriptions should provide changes.', () => {
    headers.onHeadersAdded().subscribe((success) => {
      expect(success).toBeInstanceOf(EspressoChange);
    });
  });

  test('Tests that headers can be individually added correctly.', () => {
    headers.addHeader('X-Real-Fake-Doors', 'test');
    expect(headers.headers.size).toBeGreaterThan(0);
  });

  test('Tests that headers can be removed', () => {
    headers.removeHeader('X-Real-Fake-Doors');
    expect(headers.headers.size).toBe(0);
  });

  test('Tests that headers can be set as an array', () => {
    headers.addHeaders([
      ['X-Get-Schwifty', 'test'],
      ['X-Terry-Flap', 'test']
    ]);
    expect(headers.headers.size).toEqual(2);
  });

  test('Tests that headers are reset correctly.', () => {
    headers.resetHeaders();
    expect(headers.headers.size).toEqual(0);
  });
});

describe('EspressoHttpWrapperOptions', () => {
  test('Tests that the wrapper options initialises properly', () => {
    const options = new EspressoHttpWrapperOptions({
      maxListeners: 100,
      maxHeaders: 100,
      timeout: 1000,
      keepAliveTimeout: 1000,
      hostName: 'localhost',
      port: 3000
    });
    expect(options.configMaxListeners).toEqual(100);
    expect(options.configMaxHeaders).toEqual(100);
    expect(options.configTimeout).toEqual(1000);
    expect(options.configKeepAliveTimeout).toEqual(1000);
    expect(options.configHostName).toEqual('localhost');
    expect(options.configPort).toEqual(3000);
  });
});
