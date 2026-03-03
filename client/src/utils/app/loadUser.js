import { INIT } from '@CONSTANTS';

export const loadUser = (
  setUserFormValidated,
  setUserEntryForm,
  setShowAlert,
  setShowModal
) => {
  setUserFormValidated(false); // clear form validation
  setUserEntryForm((s) => ({ ...s, ...INIT.credentials })); // user entry form obj
  setShowAlert((s) => ({
    ...s,
    login: true,
    logout: false,
    activate: false,
    err: false,
  }));
  setShowModal((s) => ({ ...s, credentials: false }));
};
