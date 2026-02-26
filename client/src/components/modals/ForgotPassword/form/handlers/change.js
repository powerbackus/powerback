const change = (e, v, m) => {
  v((s) => (s = false));
  m(e.target.value); // set email
};

export default change;
