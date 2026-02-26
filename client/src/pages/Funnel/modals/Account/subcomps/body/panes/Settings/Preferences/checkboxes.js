const tooltip = {
    infoPlacement: 'auto',
    icon: 'question-circle settings-tooltip',
  },
  CHECKBOXES = [
    {
      cls: 'my-2 mt-lg-3',
      label: 'District Updates',
      tooltip: {
        ...tooltip,
        toolTipId: 'districtUpdates',
        message:
          "Auto-emails you when you've made a new celebration. (You can always get a freshly emailed receipt from the Celebrations panel timeline.)",
      },
    },
    {
      cls: 'my-2',
      label: 'Election Date Updates',
      tooltip: {
        ...tooltip,
        toolTipId: 'electionDateUpdates',
        message:
          "Auto-tweets after your edits/approval when you've made a new celebration. (You can always do this manually with an extra button click.)",
      },
    },
    {
      cls: 'my-2',
      label: 'Celebration Status Updates',
      tooltip: {
        ...tooltip,
        toolTipId: 'celebrationStatusUpdates',
        message:
          'Controls if tooltips (like this one) display throughout the app.',
      },
    },
  ];

export default CHECKBOXES;
