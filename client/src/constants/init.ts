import type { Settings, ShowAlert, ShowModal } from '@Contexts';
import type { Init } from '@Interfaces';

const INITIAL_SETTINGS: Settings = {
  unsubscribedFrom: [],
  emailReceipts: true,
  showToolTips: true,
  autoTweet: false,
};

export const INITIAL_ALERTS: ShowAlert = {
  activate: false,
  linkSent: false,
  rejected: false,
  delete: false,
  logout: false,
  update: false,
  login: false,
  join: false,
  err: false,
};

const INITIAL_MODALS: ShowModal = {
  contributing: false,
  credentials: false,
  eligibility: false,
  explainer: false,
  pacLimit: false,
  account: false,
  privacy: false,
  limit: false,
  terms: false,
  FAQ: false,
};

export const INIT: Init = {
  condition: 'A roll-call vote on H.J.Res.54 in the House of Representatives',
  overlays: {
    resetPass: false,
  },
  alerts: {
    ...INITIAL_ALERTS,
  },
  modals: {
    ...INITIAL_MODALS,
  },
  initialSettings: INITIAL_SETTINGS,
  searchOption: {
    label: 'Searching by Name',
    value: 'Name',
    name: 'NAME',
  },
  activeSearchOption: {
    NAME: 'options-link-active',
    DISTRICT: '',
    STATE: '',
  },
  location: {
    address: '',
    ocd_id: '',
  },
  userData: {
    payment: { customer_id: '', payment_method: '' },
    settings: INITIAL_SETTINGS,
    tipLimitReached: false,
    compliance: 'guest',
    understands: false,
    isEmployed: true,
    phoneNumber: '',
    occupation: '',
    donations: [],
    firstName: '',
    employer: '',
    lastName: '',
    passport: '',
    username: '',
    address: '',
    country: '',
    ocd_id: '',
    email: '',
    state: '',
    city: '',
    zip: '',
    id: '',
  },
  contactInfo: {
    isEmployed: true,
    phoneNumber: '',
    occupation: '',
    firstName: '',
    employer: '',
    lastName: '',
    passport: '',
    address: '',
    country: '',
    email: '',
    state: '',
    city: '',
    zip: '',
  },
  credentials: { username: '', password: '', err: 500 },
  userEntryForm: { username: '', password: '' },
  changePasswordForm: {
    newPassword: '',
    currentPassword: '',
  },
  // "passFormObject"
  honestPol: {
    bluesky: '',
    twitter: '',
    youtube: '',
    facebook: '',
    mastodon: '',
    truth_social: '',
    middle_name: '',
    first_name: '',
    instagram: '',
    last_name: '',
    district: '',
    chamber: '',
    ocd_id: '',
    FEC_id: '',
    state: '',
    name: '',
    id: '',
  },
};
