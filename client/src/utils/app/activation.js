import API from '@API';
import { logError } from '../logging';

export const activation = async (hash) => {
  return await API.confirmActivationHash(hash).catch((err) =>
    logError('Activation confirm failed', err)
  );
};
