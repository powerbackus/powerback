export const shuffle = (array) => {
  // Work on a shallow copy so we never mutate inputs that may be frozen
  const copy = Array.isArray(array) ? array.slice() : [];
  let length = copy.length;

  while (length !== 0) {
    const randomness = Math.floor(Math.random() * length);
    length--;
    [copy[length], copy[randomness]] = [copy[randomness], copy[length]];
  }

  return copy;
};
