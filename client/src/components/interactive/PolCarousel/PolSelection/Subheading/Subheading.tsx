import React from 'react';
import { Constituency } from '@Components/displays';
import { formatHouseDistrictForDisplay } from '@Utils';
import './style.css';

type SubheadingProps = {
  state: string;
  district: string;
  highlight: boolean;
};

const Subheading = ({ state, district, highlight }: SubheadingProps) => (
  <Constituency
    cls={'district' + (highlight ? ' highlight' : '')}
    district={formatHouseDistrictForDisplay(district, state)}
    state={state as string}
    headingSize={6}
  />
);

export default React.memo(Subheading);
