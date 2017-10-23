const   EspressoServer = require("./../espresso.server"),
        EspressoServerInstance = EspressoServer.EspressoServerInstance,
        EspressoServerInstanceParameters = EspressoServer.EspressoServerInstanceParameters;

test('A server can be initialised with parameters ',()=>{
    const params = new EspressoServerInstanceParameters({
        hostname: 'localhost',
        port: 1337,
        encoding: 'utf8',
        max_headers: 100,
        keep_alive: 1000,
        timeout: 1000
    });
    let server = new EspressoServerInstance(params);  
    expect(params.hostname).toEqual(server._options.hostname);
    expect(params.port).toEqual(server._options.port);
    expect(params.keep_alive).toEqual(server._options.keep_alive);
    expect(params.timeout).toEqual(server._options.timeout);
});

test('A server should default values if not set',()=>{
    let server = new EspressoServerInstance();
    let param = new EspressoServerInstanceParameters();
    expect(server._options.hostname).toEqual(param.DEFAULT_HOSTNAME);
    expect(server._options.port).toEqual(param.DEFAULT_PORT_NUMBER);
    expect(server._options.keep_alive).toEqual(param.DEFAULT_KEEP_ALIVE);
    expect(server._options.max_headers).toEqual(param.DEFAULT_MAX_HEADERS);
    expect(server._options.timeout).toEqual(param.DEFAULT_TIMEOUT);
});

test('A server should fail to start without modules or routes.',()=>{
    try {
        let server = new EspressoServerInstance();
        server.start();
        server.stop();
    } catch(Err) { 
        expect(Err).not.toBeNull();
    }
});

test('A server should start if it has routes or modules',()=>{
    try {
        let server = new EspressoServerInstance();
        server.addModule({});
        server.start();
        expect(server.isListening).toEqual(true);
        server.stop();
    } catch(Err) { 
        expect(Err).toBeNull();
    }
});