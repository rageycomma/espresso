module.exports.EspressoServerHttpStatuses = new Map([

    // 2xx - OK
    ['OK',200],
    ['Created',201],
    ['Accepted',202],
    ['NonAuthInformation',203],
    ['NoContent',204],
    ['ResetContent',205],
    ['PartialContent',206],
    ['MultiStatus',207],
    ['AlreadyReported',208],
    ['IMUsed',226],

    // 3xx - Redirect
    ['MultipleChoices',300],
    ['MovedPermanently',301],
    ['Found',302],
    ['SeeOther',303],
    ['NotModified',304],
    ['UseProxy',305],
    ['TemporaryRedirect',307],
    ['PermanentRedirect',308],

    // 4xx - Client Errors
    ['BadRequest',400],
    ['Unauthorized',401],
    ['PaymentRequired',402],
    ['Forbidden',403],
    ['NotFound',404],
    ['MethodNotAllowed',405],
    ['NotAcceptable',406],
    ['ProxyAuthRequired',407],
    ['Timeout',408],
    ['Conflict',409],
    ['Gone',410],
    ['LengthRequired',411],
    ['PreconditionFailed',412],
    ['PayloadTooLarge',413],
    ['URITooLong',414],
    ['UnsupportedMediaType',415],
    ['RangeNotSatisfiable',416],
    ['ExpectationFailed',417],
    ['ImATeapot',418],
    ['MisdirectedRequest',421],
    ['Unprocessable',422],
    ['Locked',423],
    ['FailedDependency',424],
    ['UpgradeRequired',426],
    ['PreconditionRequired',428],
    ['TooManyRequests',429],
    ['HeaderFieldsTooLarge',431],
    ['UnavailableLegalReasons',451],

    // 5xx - Server errors
    ['InternalServerError',500],
    ['NotImplemented',501],
    ['BadGateway',502],
    ['ServiceUnavailable',503],
    ['GatewayTimeout',504],
    ['HTTPVersionUnsupported',505],
    ['InsufficientStorage',507],
    ['LoopDetected',508],
    ['NotExtended',510],
    ['NetworkAuthRequired',511],

    // Espresso lame-o codes.
    ['Squanchy',112]
]);