import API from '@API';
import { logError } from '../clientLog';

export const updateUser = (
  { id, donations },
  setUserData,
  info,
  stopSpinner
) => {
  if (!id || !donations) {
    return;
  } else {
    let updatesObj = info;
    const userDonations = donations;
    if (Object.keys(info).includes('settings')) {
      let strSettings = JSON.stringify(info.settings);
      sessionStorage.setItem('pb:settings', strSettings);
    }
    API.updateUser(id, info) // api call
      .then(() => {
        updatesObj.donations = userDonations;
        setUserData((u) => ({ ...u, ...updatesObj })); // update user state and re-attach donations array
      })
      .catch((error) => {
        logError('Update user error', error);
        // Stop spinner on any error (including validation errors)
        if (stopSpinner) {
          stopSpinner();
        }
      });
  }
};
