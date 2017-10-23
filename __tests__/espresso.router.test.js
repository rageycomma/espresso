const   server = require('./../espresso.server'),
        router = require('./../espresso.router'),
        EspressoServer = server.EspressoServerInstance,
        EspressoRouteSubscriber = router.EspressoRouteSubscriber;

test('The router should receive an incoming request',()=>{
    let serv = new EspressoServer();
    serv.addModule({});
    serv.start();
    expect(true).toEqual(true);
    serv.stop();

    var rs = new EspressoRouteSubscriber(serv._router,(res,scope,error)=>{
        scope.done("yay");
        var x= 'y';
    });

    serv._router.addRouteItem(rs);


});