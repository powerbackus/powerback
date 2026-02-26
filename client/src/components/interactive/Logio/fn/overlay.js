export default function handleOverlay(e, setTarget, setShowOverlay) {
  if (!e) return;
  if (e.key) {
    if (e.key !== 'Enter' && e.key !== ' ') {
      return;
    }
  }
  setShowOverlay((o) => ({ ...o, resetPass: true }));
  if (e.target?.type !== 'button') setTarget((t) => (t = e.target));
}
