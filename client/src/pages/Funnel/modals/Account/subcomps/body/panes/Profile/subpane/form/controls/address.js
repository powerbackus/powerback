// controls/address.js

module.exports = {
  ADDRESS: [
    {
      type: 'text',
      name: 'address',
      label: 'Address',
      'aria-label': 'home address',
      pattern:
        '[0-9]-{0,1}[0-9]*[\\s]{0,1}[0-9][/]{0,1}[0-9]{0,1}[\\s]{1}[a-zA-Z]{0,1}.{0,1}[\\s]{0,1}[a-zA-Z]+[\\s\\S]*'
          .encodeURIComponent,
      required: true,
    },
    {
      name: 'zip',
      type: 'text',
      label: 'Zip',
      pattern: '[A-Za-z0-9\\s\\-\\.]{2,20}'.encodeURIComponent,
      'aria-label': 'zip/postal code',
      required: true,
    },
    {
      type: 'text',
      name: 'city',
      label: 'City',
      'aria-label': 'city',
      pattern: "([A-Za-z-'.\\s]*)".encodeURIComponent,
      required: true,
    },
    {
      name: 'state',
      type: 'select',
      label: 'State',
      'aria-label': 'state',
      required: true,
    },

    {
      name: 'country',
      type: 'select',
      label: 'Country',
      'aria-label': 'country',
      required: true,
    },
    {
      type: 'text',
      name: 'passport',
      autoComplete: 'off',
      'data-lpignore': 'true',
      label: 'US Passport',
      pattern: '([A-Za-z0-9]){6,9}'.encodeURIComponent,
      'aria-label': 'passport number',
      formtext: 'Required outside the United States.',
      required: true,
    },
  ],
};
