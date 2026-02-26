import { logError } from '@Utils';

const submit = (
  e,
  email,
  setAlert,
  setFeedback,
  setValidated,
  setShowOverlay,
  forgotPassword
) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.currentTarget.checkValidity() === false) {
    setValidated(true); // validate form
    setFeedback('Please enter a valid email address.'); // user input feedback
    return;
  } else {
    setShowOverlay((o) => ({ ...o, resetPass: !o.resetPass })); // hide popover
    forgotPassword({ email })
      .then(() => {
        setValidated(false); // reset validation
        setAlert((a) => ({ ...a, linkSent: true })); // show alert
      })
      .catch((err) => logError('Forgot password request failed', err));
  }
};

export default submit;
