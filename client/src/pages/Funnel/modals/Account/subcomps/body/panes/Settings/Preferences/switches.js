const tooltip = {
    infoPlacement: 'auto',
    icon: 'question-circle settings-tooltip',
  },
  SWITCHES = [
    {
      cls: 'mt-2 mt-lg-3 mb-lg-2',
      label: 'Auto-email celebration receipts',
      tooltip: {
        ...tooltip,
        toolTipId: 'emailReceipts',
        message:
          "Auto-emails you when you've made a new celebration. (You can always get a freshly emailed receipt from the Celebrations panel timeline.)",
      },
    },
    {
      cls: 'my-lg-2 my-1',
      label: 'Auto-tweet my celebrations',
      tooltip: {
        ...tooltip,
        toolTipId: 'autoTweet',
        message:
          "Auto-tweets after your edits/approval when you've made a new celebration. (You can always do this manually with an extra button click.)",
      },
    },
    {
      cls: 'my-lg-2 my-1',
      label: 'Show tooltips',
      tooltip: {
        ...tooltip,
        toolTipId: 'showToolTips',
        message:
          'Controls if tooltips (like this one) display throughout the app.',
      },
    },
    // remove all "naming post office bills" from choices would be a fun one for the future =)
  ];

export default SWITCHES;
