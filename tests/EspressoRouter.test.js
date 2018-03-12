/* eslint no-undef: 0 */
const { EspressoRouter, EspressoRoute, EspressoModuleContainer } = require('./../EspressoRouter');
const { EspressoRouteCommandIdle, EspressoRouteCommandDoRoute, EspressoRouteCommandReturnData } = require('./../EspressoConst');

describe('EspressoRouter - It should work properly.', () => {
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
