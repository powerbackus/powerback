export const handleKeyDown = (e, cb = () => {}, arg) => {
  if (
    !(
      e.type === 'click' ||
      (e.type === 'keydown' && (e.key === ' ' || e.key === 'Enter'))
    )
  )
    return;
  else cb(arg ? arg : e);
};
