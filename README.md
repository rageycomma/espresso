
Espresso is a highly-opionionated, agitating, loudmouth brawler of a HTTP server. Based upon RxJS and Observables, it's designed to take all the headache out of HTTP-servering, and provide simple modularity.

# Installation #
At the moment, to install, clone this repository. However, it's not recommended to use this in a production release at the moment as this is alpha software. 

# Features # 
* Uses RxJS and Observers to signal changes in:
  * Incoming and outgoing traffic
  * Changes to routing
  * More to be added as development progresses.
* Core
  * JSON and XML parsed and processed by default 
* Routing
  * GET, POST or ANY
  * Route formats (expect `JSON`, `XML`, etc)
  * Named route parameters (`/path/{param1}/{param2}/`)
  * Route parameter requirements (i.e. formats)
* Modules
  * Lifecycle - run at different stages (connection,auth,response,post-response) - no more iterative junk. 
  * Integrated module runtime - `EspressoServer` determines what runs when.
  * Global error handler - No more "last in the queue", `EspressoServer` handles all errors globally. 
  * Append-only - Modules only append the ingoing or outgoing response, and `EspressoServer` determines when to send the message, not the module, ensuring message is always sent and junk modules don't break the stack.


# Use #
To create a single Espresso instance, it's as simple as:
```javascript

    const   espresso = require("espresso"),
            EspressoServer = espresso.EspressoServer;

    const   my_functionality = require("./../my_stuff");

    // Starts the server
    var _server  = new EspressoServer({port: 3000});

    // Set up modules (will be executed on every incoming request)
    _server.modules([
        module_1,
        module_2,
        ...
    ]);

    // Set up routing.
    var _routes = [
        {
            path: "/{param1}/{param2}",
            method: "any",
            format: "json",
            path_requirements: { 
                "param1": { 
                    "pattern": /(rick|morty|schwifty)/
                },
                "param2": { 
                    "pattern": /[A-Za-z0-9]/
                }
            }
            handler: my_functionality.do_stuff
        }
    ];

    // Tell the server what routes to use.
    _server.routes(_routes);

    // Start the server.
    _server.start();
```

Example of a module:
```javascript
const EspressoServerModule = require("espresso").EspressoServerModule;
module.exports = new EspressoServerModule("Tst","beforeResponse",(request)=>{
    return request.set({
        contentType: "application/json",
        statusCode: 200,
        headers: { 
            "x-super-schwift": "morty"
        },
        content: { 
            "a" :"b",
            "c" : "rick"
        }
    });
```

# Design #
Espresso is designed to take all of the configuration out, and to provide you with a well-formed, easy-to-deploy HTTP server, and separates out server-wide functionality (i.e. Authentication, body parsing, etc) from server-specific functionality (i.e. Your routes, etc).

## Core functionality ##
Espresso provides default functionality which can be configured, but which, generally, you just want to leave alone and let run. This is defined as classes that run at runtime which the server chooses to load based upon the incoming or outgoing message type. 

Core functionality for both incoming and outgoing includes:
  *  Formats/MIME Type parsing
        *  JSON
        *  XML
        *  Others not yet supported
  *  Authentication
  *  Security (CORS, Origin, etc)
  *  Timeouts
  *  More to be added here as development progresses

This functionality will be provided as separate packages, however, this functionality sits differently within Espresso. 

## Modules ##
Modules are additional functionality within Espresso to extend what espresso does when it receives or sends a response to the end-user. They are termed modules, because they extend the functionality of Espresso, but are not used to provide basic functionality (like parsing incoming data, etc).