const   Espresso = require("./../index"),
        EspressoServer = Espresso.EspressoServer;

var _server = new EspressoServer({
    port: 3000,
    hostname: "localhost"
});
