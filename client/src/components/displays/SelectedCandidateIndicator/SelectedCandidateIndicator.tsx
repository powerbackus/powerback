import React from 'react';
import { PolName, Constituency } from '@Components/displays';
import { useDonationState } from '@Contexts';
import { formatHouseDistrictForDisplay, HOUSE_AT_LARGE_LABEL } from '@Utils';
import './style.css';

/**
 * SelectedPolIndicator component
 *
 * Displays a persistent indicator showing the currently selected candidate's
 * name and district/state information. This component remains visible when
 * the selected candidate is scrolled out of view, providing clear visual
 * feedback about the current selection.
 *
 * Note: The selection is automatically cleared if the selected candidate is
 * filtered out of the carousel results, so this indicator will disappear in
 * that case.
 *
 * @component
 */
const SelectedPolIndicator = () => {
  const { selectedPol, polData } = useDonationState();

  // Only render when a candidate is selected
  if (!selectedPol || !polData || !polData.id) {
    return null;
  }

  // Format candidate name - prefer polData.name, fallback to first_name + last_name
  const candidateName =
    polData.name ||
    `${polData.first_name || ''} ${polData.last_name || ''}`.trim();

  const districtLabel = formatHouseDistrictForDisplay(
    polData.district,
    polData.state
  );
  const constituencyTitle =
    districtLabel === HOUSE_AT_LARGE_LABEL
      ? `${HOUSE_AT_LARGE_LABEL} of ${polData.state}`
      : districtLabel
        ? `District ${districtLabel} of ${polData.state}`
        : polData.state;

  return (
    <div
      className='selected-candidate-indicator'
      aria-live='polite'
    >
      <div className='selected-candidate-content'>
        <PolName
          title={`Selected candidate: ${candidateName}`}
          cls={'selected-candidate-name'}
          name={candidateName}
          headingSize={5}
        />
        <Constituency
          title={constituencyTitle}
          cls={'selected-candidate-constituency'}
          district={districtLabel || polData.district}
          state={polData.state}
          headingSize={6}
        />
      </div>
    </div>
  );
};

export default React.memo(SelectedPolIndicator);
