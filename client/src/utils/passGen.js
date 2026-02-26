export const passGen = () => {
  const c =
    '`~!@#$%^&*()-_=+[{]}\\|;:\'",<.>/?1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(
      ''
    );
  let p = '';
  for (let i = 0; i < Math.floor(Math.random() * (24 - 13) + 12); i++) {
    let r = Math.floor(Math.random() * 93);
    p += c[r];
  }
  return p;
};
