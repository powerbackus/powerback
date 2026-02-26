// h/t zingi https://bit.ly/3Gy5Se9 @ https://bit.ly/3k9VLVz
export const getStandardDeviation = (p) => {
  if (!p || p.length === 0) {
    return 0;
  }
  const n = p.length;
  const mean = p.reduce((a, b) => a + b) / n;
  return Math.sqrt(
    p.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  );
};
