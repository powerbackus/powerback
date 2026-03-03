const { handleDisableContinueBtn } = require('./disableContinueBtn');

module.exports = {
  handleHide: (donation, selectedPol) => {
    if (handleDisableContinueBtn(donation, selectedPol)) {
      return 'hide-cont--btn';
    } else {
      return 'show-cont--btn';
    }
  },
};
