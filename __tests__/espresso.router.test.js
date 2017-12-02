const   server = require('./../espresso.server'),
        router = require('./../espresso.router'),
        EspressoServer = server.EspressoServerInstance,
        EspressoRouteSubscriber = router.EspressoRouteSubscriber;

test('The router should receive an incoming request',()=>{
    let serv = new EspressoServer({
        hostname: 'localhost',
        port: 6758,
        encoding: 'utf8',
        max_headers: 100,
        keep_alive: 1000,
        timeout: 1000
    });
    serv.addModule({});
    serv.start();
    expect(true).toEqual(true);

    var rs = new EspressoRouteSubscriber(serv._router,($incoming)=>{
        $incoming
        .addHeaders([
            ["Content-Type","application/json"],
            ["First-Type","First"]
        ])
        .addContent({
            my_content_1: 'Test me'
        })
        .setStatus('BadRequest')
        .done();
    });
    var xs = new EspressoRouteSubscriber(serv._router,($incoming)=>{
        $incoming
        .addHeaders([
            ['Second-Type','Second']
        ])
        .addContent({
            my_content_2: 'Test me 2'
        }).done();
    });
    var xs2 = new EspressoRouteSubscriber(serv._router,($incoming)=>{
        $incoming
        .addHeaders([
            ['Third-Type','Third']
        ])
        .addContent({
            my_content_3: 'Test me 3'
        })
        .setStatus('BadRequest').done();
    });
    serv._router.addRouteItem(rs);
    serv._router.addRouteItem(xs);
    serv._router.addRouteItem(xs2);
});