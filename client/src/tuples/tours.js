module.exports = {
  User: [
    {
      target: 'span.powerback',
      data: { tour: 'User' },
      disableBeacon: true,
      sm: {
        target: 'div.pol-carousel',
        placement: 'bottom',
        offset: -10,
      },
      content:
        'Welcome to POWERBACK.us, the revolution in election campaign finance! Support representatives who share your values by tying your donations to Congressional events.',
    },
    {
      target: '.hide-scrollbar',
      offset: -10,
      sm: { target: '#choose-pols', offset: -5 },
      placement: 'bottom',
      content:
        'Search for any current member of the U.S. House that has stakes in ensuring their re-election. Any challenged incumbent is fair game.',
    },
    {
      target: 'button.options-link-active',
      sm: { offset: -5 },
      content:
        "Search by Name, State, or a full mailing address to find a District's representative, such as your own.",
    },
    {
      target: 'div.pol-w-card',
      placement: 'center',
      data: { screen: 'lg' },
      content:
        'Select any Representative. From there, you can create a conditional donation, called a Celebration. If the condition is met, all funds are released to their campaigns.',
    },
    {
      target: '.lobby-middle',
      data: { screen: 'sm' },
      offset: -10,
      content:
        'Swipe through the list and tap any Representative. From there, you can create a conditional donation, called a Celebration. If the condition is met, all funds are released to their campaigns.',
    },
    {
      target: 'div.mt-1.col-2 span.navbar-brand img',
      data: { screen: 'sm' },
      content:
        'Need help? Click the logo to open the menu. From there, you can access the FAQ, Terms, and other resources.',
    },
  ],
  Celebration: [
    {
      target: '[data-tour="account-open"]',
      data: { tour: 'Celebration' },
      placement: 'bottom',
      content:
        'Congrats on your first Celebration! You can view all of your Celebrations in the Account menu.',
    },
  ],
};
