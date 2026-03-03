export const cycle = (d) => {
  // calibrate timezone
  d.setHours(d.getHours() + d.getTimezoneOffset() / 60);
  // start at 1st
  d.setDate(1);
  // 10 is November
  d.setMonth(10);
  // set date modularly to first Tuesday
  d.setDate(d.getDate() + ((9 - d.getDay()) % 7));
  // not first Tuesday and the 1st as law states must come after first Monday
  if (d.getDate() === 1) d.setDate(8);
  // reset clock to midnight
  d.setHours(0, 0, 0, 0);
  return d;
};
