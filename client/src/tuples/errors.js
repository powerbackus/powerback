module.exports = [
  {
    status: 400,
    icon: 'person-fill-exclamation',
    msg: 'Bad request. Please try again.',
  },
  {
    status: 401,
    icon: 'shield-slash',
    msg: 'Incorrect username or password.',
  },
  {
    status: 403,
    icon: 'lightning',
    msg: 'Please try again with a stronger password.',
  },
  {
    status: 409,
    icon: 'person-x-fill',
    msg: 'This account is not authorized.',
  },
  {
    status: 422,
    icon: 'shield-fill-exclamation',
    msg: 'Server processing error. Please try again later.',
  },
  {
    status: 429,
    icon: 'hourglass-split',
    msg: 'You may have reached your donation limit or too many attempts were made. You have not been charged. Please try again in a moment.',
  },
  {
    status: 500,
    icon: 'bug-fill',
    msg: 'Something went wrong. Please try again.',
  },
];
