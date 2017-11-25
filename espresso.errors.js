
module.exports.EspressoServerTimeoutError =  class EspressoServerTimeoutError {
    constructor(code = "Ex00001",message = "The request could not be fulfilled as it timed out. If incoming data is being truncated, please change the timeout value.") {}
};

module.exports.EspressoServerUnsupportedMIMETypeError = class EspressoServerUnsupportedMIMETypeError { 
    constructor(code = "Ex00002" ,message = "The MIME Type provided is not supported.") {}
};

module.exports.EspressoServerInvalidFormatError = class EspressoServerInvalidFormatError { 
    constructor(code="Ex00003", message = "The data provided in the body of the HTTP request does not match the content-type provided.") {}
};

module.exports.EspressoServerModuleError = class EspressoServerModuleError {
    constructor(code="Ex00004",message = "") {}
};

module.exports.EspressoServerNoActionError = class EspressoServerNoActionError {
    constructor(code="Ex00005",message="The server instance could not be started as it does not contain any attached modules or routes.") {}
};

module.exports.EspressoServerInvalidParametersError = class EspressoServerInvalidParametersError { 
    constructor(code="Ex00006",message="The parameters passed to the server instance were invalid. Either an object or an instance of EspressoServerInstanceParameters is expected."){}
};

module.exports.EspressoServerNonUniformResponseError = class EspressoServerInvalidParametersError { 
    constructor(code="Ex00007",message="When fielding a response from routes, the response from each of the bound routes was not uniform, therefore Espresso does not know how to resolve content.") {}
};