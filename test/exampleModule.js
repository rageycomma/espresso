const EspressoServerModule = require("./../index").EspressoServerModule;

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
    /*return request
        .contentType("application/json")
        .statusCode(201)
        .headers({
            "x-custom-schwift" : "schwifty"
        })
        .content({
            a : "B",
            c: "d"
        });*/
});