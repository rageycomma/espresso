const   Espresso = require("./../index"),
        EspressoServer = Espresso.EspressoServer,
        EspressoServerModule = Espresso.EspressoServerModule;

var _server = new EspressoServer({
    port: 3000
})
.modules([
    new EspressoServerModule("Tst","beforeResponse",(x)=>{
        x.poop = "OHMYGAWF";
        x.addContent({a: "b"});
        x.addContent({b: "C"});
        return x;
    })
])
.start();
