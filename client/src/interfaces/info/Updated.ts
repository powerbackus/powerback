import { Settings } from '@Contexts';
import { ContactInfo } from './Contact';

export type UpdatedInfo =
  | Date
  | object
  | string
  | boolean
  | Settings
  | keyof ContactInfo;
