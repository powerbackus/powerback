import type {
  PolData,
  Settings,
  UserData,
  ShowAlert,
  ShowModal,
  LinksClass,
  SearchOption,
  UserEntryResponse,
} from '@Contexts';
import type { Location } from './pols';
import type { UserEntryForm } from '@Hooks';
import type { ContactInfo, ConfirmNewPasswordForm } from '@Interfaces';

export interface Init {
  changePasswordForm: ConfirmNewPasswordForm;
  activeSearchOption: LinksClass;
  credentials: UserEntryResponse;
  userEntryForm: UserEntryForm;
  searchOption: SearchOption;
  initialSettings: Settings;
  contactInfo: ContactInfo;
  overlays: {
    resetPass: boolean;
  };
  honestPol: PolData;
  location: Location;
  userData: UserData;

  alerts: ShowAlert;
  modals: ShowModal;
  condition: string;
}
