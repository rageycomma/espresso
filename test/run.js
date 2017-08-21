const   Espresso = require("./../index"),
        EspressoServer = Espresso.EspressoServer,
        EspressoServerModule = Espresso.EspressoServerModule,
        exampleModule = require("./exampleModule");

var _server = new EspressoServer({
    port: 3000
})
.modules([
    exampleModule
])
.start();
