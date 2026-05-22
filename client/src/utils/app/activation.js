/**
 * @fileoverview Email activation confirm; clears pb:refShareCode after success.
 * @module utils/app/activation
 *
 * Attribution uses Applicant.ref_share_code on server (no refShareCode query param).
 */
import API from '@API';
import { logError } from '../logging';
import { clearStoredRefShareCode } from '../storage/refShareCodeStorage';

/**
 * Confirm activation hash and clear inbound referral storage on success.
 *
 * @param {string} hash - joinHash from /join/:hash or /activate/:hash route
 * @returns {Promise<import('axios').AxiosResponse|undefined>} Activation response
 */
export const activation = async (hash) => {
  try {
    const response = await API.confirmActivationHash(hash);
    if (response?.data?.isHashConfirmed && !response?.data?.isLinkExpired) {
      clearStoredRefShareCode();
    }
    return response;
  } catch (err) {
    logError('Activation confirm failed', err);
    return undefined;
  }
};
