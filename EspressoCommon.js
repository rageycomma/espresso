/**
 * A global change object to be emitted.
 *
 * @class EspressoChange
 */
class EspressoChange {
  constructor(changeType, previousValue, currentValue = null, currentId = null) {
    Object.assign(this, {
      changeType,
      previousValue,
      currentValue,
      currentId
    });
  }
}

module.exports = {
  EspressoChange
};
