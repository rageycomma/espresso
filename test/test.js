const   mocha = require("mocha"),
        chai = require("chai"),
        expect = chai.expect,
        should = chai.should,
        espresso = require("./../index"),
        EspressoServerInstance = espresso.EspressoServerInstance,
        Rx = require("rxjs/Rx");


describe("It should create a server correctly",()=>{
        var x = new EspressoServerInstance();
        x.connectObservable$.subscribe(
                (x) => {console.log(x);},
                (y) => {console.log(y);},
                () => { console.log("Error");}
        );
});