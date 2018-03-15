/* eslint no-undef: 0 */
const { EspressoRouter, EspressoRoute } = require('./../EspressoRouter');

const { EspressoRouteCommandDoRoute } = require('./../EspressoConst');

const { EspressoErrorInvalidRouteParameters } = require('./../EspressoErrors');

describe('EspressoRouter - It should work properly.', () => {
  it('Should correctly add routes to the router.', () => {
    let Router = new EspressoRouter();

    const Route = new EspressoRoute({
      path: '/path/path',
      mimeType: 'application/json',
      action: (out) => {
        out.done();
      }
    });

    Router.addRoute(Route);
    expect(Router.Routes).toHaveLength(1);
  });

  it('Should choke on malformed routes, and throw errors.', () => {
    expect(() => new EspressoRoute({})).toThrowError(EspressoErrorInvalidRouteParameters);
    expect(() => new EspressoRoute()).toThrowError(EspressoErrorInvalidRouteParameters);
    expect(() => new EspressoRoute('OMGHAX')).toThrowError(EspressoErrorInvalidRouteParameters);
    expect(() => new EspressoRoute(1337)).toThrowError(EspressoErrorInvalidRouteParameters);
  });

  it('Should route information correctly between the router and route.', () => {
    jest.setTimeout(20000000);

    // Create the router.
    const Router = new EspressoRouter();

    // Have the action callback.
    const Action = (actions) => {
      actions.addContent({ test: 1 });
      actions.done();
    };

    // Create 2 routes
    const Route = new EspressoRoute({
      path: '/my/path/',
      mimeType: 'application/json',
      action: Action
    });
    const Fruit = new EspressoRoute({
      path: '/my/path/sez',
      mimeType: 'application/json',
      action: Action
    });

    // Add the routes.
    Router.addRoute(Route);
    Router.addRoute(Fruit);

    // Issue a route command.
    Router.sendOutgoingCommand(EspressoRouteCommandDoRoute, { path: '/my/path/' });
  });
});
