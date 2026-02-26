module.exports = {
  CONTACT: [
    {
      type: 'text',
      name: 'firstName',
      label: 'First name',
      'aria-label': 'first name',
      required: true,
    },
    {
      type: 'text',
      name: 'lastName',
      label: 'Last name',
      'aria-label': 'last name',
      required: true,
    },
    {
      type: 'tel',
      name: 'phoneNumber',
      label: 'Mobile number',
      'aria-label': 'mobile number',
      required: false,
    },
    {
      type: 'email',
      name: 'email',
      autoComplete: 'off',
      label: 'Contact email',
      'data-lpignore': 'true',
      'aria-label': 'contact email address',
      feedback: 'Please enter a valid email address.',
      pattern: '^[\\w\\.]+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$',
      formtext:
        "Donation receipts and other notices to be sent here. This doesn't affect your username.",
      required: false,
    },
  ],
};
