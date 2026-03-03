import { Dispatch, SetStateAction } from 'react';

export type ChangeProps = {
  setPasswordChanged: Dispatch<SetStateAction<boolean>>;
  passwordChanged: boolean;
};
