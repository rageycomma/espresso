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
.routes([
    {
        path: "/fuck/{punks}/smoke/1/{cheese}/x/{zzz}",
        method: "POST",
        format: "json",
        handler: (schwing) =>{
            var x = "y";
        }
    },
    {
        path: "/fuckyfuck",
        method: "GET",
        format: "json",
        handler: (schwing) =>{
            var x = "y";
        }
    }
])
.start();
