module.exports = {
  handleDisableContinueBtn: (donation, selectedPol) => {
    return !selectedPol || !donation;
  },
};
