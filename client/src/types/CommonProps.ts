/**
 * Reusable prop slice types for POWERBACK React components.
 *
 * Use these by intersecting with component-specific props, e.g.:
 *   type DeleteAcctProps = UserDataProp & { handleDeleteUser: () => void };
 *
 * Aliases (same value, different prop name; prefer the canonical one):
 * - UserDataProp: user is alias of userData (prefer userData).
 *
 * Not aliases: isInitializing and accountActivated are different (auth loading vs
 * activation link clicked). activeKey and tabKey are same concept but different
 * types/usage. In Props.ts, info and polData are both PolData (info often derived
 * from polData); not included here.
 *
 * @module types/CommonProps
 */

import type {
  Dispatch,
  ChangeEvent,
  SetStateAction,
  MouseEventHandler,
  ChangeEventHandler,
  KeyboardEventHandler,
} from 'react';
import type {
  PolData,
  Settings,
  UserData,
  ShowAlert,
  ShowModal,
  FunnelView,
  LandingNavView,
  CredentialsFormView,
  ShowOverlay,
  ServerConstants,
  CredentialsPath,
} from '@Contexts';
import type {
  Bill,
  Payload,
  ContactInfo,
  DisplayName,
  UpdatedInfo,
  ValidatingFields,
} from '@Interfaces';
import { routes } from '../router';
import type { Route } from 'type-route';
import type { AccountTab } from '@CONSTANTS';
import type { CelebrationRejection } from '@Types';

/** Props slice: auth state, logout, credentials path, account activation. */
interface AuthProp {
  handleLogOut?: ChangeEventHandler | MouseEventHandler | KeyboardEventHandler;
  setAccountActivated?: Dispatch<SetStateAction<boolean>>;
  setCredentialsPath?: (path: CredentialsPath) => void;
  credentialsPath?: CredentialsPath;
  accountActivated?: boolean;
  isInitializing?: boolean;
  isLoggingIn?: boolean;
  isLoggedIn?: boolean;
}

/**
 * Props slice: current user data and setter.
 */
interface UserDataProp {
  setUserData?: Dispatch<SetStateAction<UserData>>;
  userData?: UserData;
}

/** Props slice: donation flow (amount, tip, pol, limits, errors, bill). */
interface DonationStateProp {
  setRejectedDonationReasons?: Dispatch<SetStateAction<CelebrationRejection>>;
  setPaymentError?: Dispatch<SetStateAction<Error | null>>;
  rejectedDonationReasons?: CelebrationRejection;
  setDonation?: (amount: number) => void;
  setTip?: (amount: number) => void;
  selectPol?: (pol: PolData) => void;
  remainingDonationLimit?: number;
  suggestedDonations?: number[];
  paymentError?: Error | null;
  selectedPol?: string | null;
  polData?: PolData;
  donation?: number;
  tip?: number;
  bill?: Bill;
}

/** Props slice: settings, contact info, display name, server config, profile update. */
interface ProfileProp {
  handleUpdateUser?: (user: UserData, info: UpdatedInfo) => void;
  setSettings?: Dispatch<SetStateAction<Settings>>;
  setContactInfo?: (payload: Payload) => void;
  setDisplayName?: (maxLen: number) => void;
  serverConstantsError?: Error | null;
  serverConstants?: ServerConstants;
  contactInfo?: ContactInfo;
  displayName?: DisplayName;
  settings?: Settings;
}

/** Props slice: form validity and field validation. */
interface FormValidationProp {
  validateField?: (e: ChangeEvent<HTMLInputElement>) => void;
  setUserIsAssumedValid?: Dispatch<SetStateAction<boolean>>;
  setUserFormValidated?: (isValid: boolean) => void;
  isPendingValidation?: boolean;
  isInvalid?: ValidatingFields;
  resetValidation?: () => void;
  userIsAssumedValid?: boolean;
  userFormValidated?: boolean;
  formIsInvalid?: boolean;
}

/** Props slice: route, splash, tab key, active key, profile tab. */
interface NavigationProp {
  setSplash?: (next: LandingNavView | CredentialsFormView) => void;
  setActiveProfileTab?: Dispatch<SetStateAction<string>>;
  setActiveKey?: Dispatch<SetStateAction<AccountTab>>;
  setTabKey?: (next: { step?: FunnelView }) => void;
  splash?: LandingNavView | CredentialsFormView;
  onSelect?: (key: FunnelView) => void;
  route?: Route<typeof routes>;
  activeProfileTab?: string;
  activeKey?: AccountTab;
  tabKey?: FunnelView;
}

/** Props slice: modals, alerts, overlays, side nav. */
interface DialogueProp {
  showOverlay?: ShowOverlay;
  setShowOverlay?: Dispatch<SetStateAction<ShowOverlay>>;
  showAlert?: ShowAlert;
  setShowAlert?: Dispatch<SetStateAction<ShowAlert>>;
  showModal?: ShowModal;
  setShowModal?: Dispatch<SetStateAction<ShowModal>>;
  showSideNav?: boolean;
  setShowSideNav?: Dispatch<SetStateAction<boolean>>;
}

/** Props slice: device / responsive flags. */
interface DeviceProp {
  isShortMobile?: boolean;
  isDesktop?: boolean;
  isMobile?: boolean;
}

export type {
  FormValidationProp,
  DonationStateProp,
  NavigationProp,
  DialogueProp,
  UserDataProp,
  ProfileProp,
  DeviceProp,
  AuthProp,
};
