// controls/employment.js

module.exports = {
  EMPLOYMENT: [
    {
      type: 'radio',
      name: 'isEmployed',
      label: 'Are you employed?',
      'aria-label': 'are you employed button group',
      formtext: ['(Self-employed counts as employed)', ''],
      required: true,
    },
    {
      type: 'text',
      name: 'occupation',
      label: 'Occupation',
      autoComplete: 'off',
      'data-lpignore': 'true',
      'aria-label': 'occupation',
      pattern: '^(?!\\s*$).+',
      feedback: 'Complete this field if you are Employed.',
      formtext: 'Trade or profession if self-employed',
      required: true,
    },
    {
      type: 'text',
      name: 'employer',
      label: 'Employer',
      autoComplete: 'off',
      'data-lpignore': 'true',
      'aria-label': 'employer',
      pattern: '^(?!\\s*$).+',
      feedback: 'Complete this field if you are Employed.',
      formtext: 'Your business name if self-employed',
      required: true,
    },
  ],
};
