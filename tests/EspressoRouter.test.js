/* eslint no-undef: 0 */
const { EspressoRouter, EspressoRoute } = require('./../EspressoRouter');
const { EspressoRouteCommandIdle, EspressoRouteCommandCanRoute, EspressoRouteCommandReturnData } = require('./../EspressoConst');

describe('EspressoRouter - It should work properly.', () => {
  it('Should route information correctly between the router and route.', () => {
    const Router = new EspressoRouter();
    const Action = () => {
      return false;
    };
    const Route = new EspressoRoute({
      path: '/my/path/',
      mimeType: 'application/json',
      action: Action
    });
    Router.addRoute(Route);
    Router.sendOutgoingCommand(EspressoRouteCommandCanRoute, { path: '/' });
  });
});
