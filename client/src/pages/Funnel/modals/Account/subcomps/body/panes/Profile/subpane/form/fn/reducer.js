module.exports = {
  intlReducer: (getCountry) => {
    if (getCountry)
      if (getCountry.current)
        if (getCountry.current.value !== 'United States') return true;
        else return false;
  },
};
