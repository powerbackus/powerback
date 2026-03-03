const { EMPLOYMENT } = require('./employment'),
  { ADDRESS } = require('./address'),
  { CONTACT } = require('./contact');

module.exports = {
  CONTROLS: [
    {
      key: 'account-profile-form-1',
      eventKey: 'contact',
      label: 'Contact',
      controls: CONTACT,
    },
    {
      key: 'account-profile-form-2',
      eventKey: 'address',
      label: 'Address',
      controls: ADDRESS,
    },
    {
      key: 'account-profile-form-3',
      eventKey: 'employment',
      label: 'Employment',
      controls: EMPLOYMENT,
    },
  ],
};
