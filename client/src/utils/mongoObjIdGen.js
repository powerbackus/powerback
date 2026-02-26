export const mongoObjIdGen = () => {
  // h/t Ruben Stolk
  let o = (
    m = Math,
    d = Date,
    h = 16,
    s = (s) => m.floor(s).toString(h)
  ) =>
    s(d.now() / 1000) +
    ' '.repeat(h).replace(/./g, () => s(m.random() * h));
  return o();
};
