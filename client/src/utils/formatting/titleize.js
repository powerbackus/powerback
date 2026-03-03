export const titleize = (b, m, l = 70) => {
  let d = '';
  let t = b.substring(0, m);
  d = b.substring(0, Math.max(t.length, t.lastIndexOf(' ')));
  if (d.length > l) d += '...';
  return d;
};
