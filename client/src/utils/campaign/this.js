export const thisCampaign = () => {
  const dateSetter = (year, month, date) => {
    let d = new Date();
    d.setFullYear(year);
    d.setMonth(month);
    d.setDate(date);
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };

  const setStartEndYears = () => {
    let thisYear, startYear, endYear;
    let d = new Date();
    thisYear = d.getFullYear();
    if (thisYear % 2 === 1) startYear = thisYear;
    else startYear = thisYear - 1;
    endYear = thisYear + 1;
    return { start: startYear, end: endYear };
  };

  const getYears = setStartEndYears();

  let startCampaign = dateSetter(getYears.start, 0, 1),
    endCampaign = dateSetter(getYears.end, 11, 31);

  return {
    start: startCampaign,
    end: endCampaign,
  };
};
