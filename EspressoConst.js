// Logging constants.
const EspressoLogTypeError = 'Cx00000';
const EspressoLogTypeWarn = 'Cx00001';
const EspressoLogTypeInfo = 'Cx00002';
const EspressoLogTypeVerbose = 'Cx00003';
const EspressoLogTypeDebug = 'Cx00004';
const EspressoLogTypeSilly = 'Cx00005';
const EspressoLogTypeSuccess = 'Cx00006';
const EspressoLogOutputFile = 'Cx00007';
const EspressoLogOutputFileRotating = 'Cx00008';
const EspressoLogOutputConsole = 'Cx00009';

// Router constants.
const EspressoRouteCommandIdle = 'Cx00010';
const EspressoRouteCommandDoRoute = 'Cx00011';

// Change types
const EspressoRouteChangeTypeHeaders = 'Cx00012';
const EspressoRouteChangeTypeContent = 'Cx00013';

module.exports = {
  EspressoRouteChangeTypeHeaders,
  EspressoRouteChangeTypeContent,
  EspressoRouteCommandDoRoute,
  EspressoRouteCommandIdle,
  EspressoLogOutputConsole,
  EspressoLogOutputFileRotating,
  EspressoLogOutputFile,
  EspressoLogTypeWarn,
  EspressoLogTypeInfo,
  EspressoLogTypeError,
  EspressoLogTypeSuccess,
  EspressoLogTypeDebug,
  EspressoLogTypeVerbose,
  EspressoLogTypeSilly
};
