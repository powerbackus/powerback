import React, { useMemo, useLayoutEffect } from 'react';
import { PolName } from '@Components/displays';
import { HouseMember } from '@Interfaces';
import { useDisplayName } from '@Hooks';

type TitleProps = {
  donee: HouseMember;
};

const Title = ({ donee }: TitleProps) => {
  const [displayName, { setDisplayName }] = useDisplayName({
    first: donee?.first_name as string,
    last: donee?.last_name as string,
    middle: donee.middle_name ?? '',
  });

  const firstAndListName = `${donee.first_name} ${donee.last_name}`;

  const getShorterName = useMemo(
    () =>
      Math.min(displayName.value.length, firstAndListName.length) ===
      displayName.value.length
        ? displayName.value
        : firstAndListName,
    [displayName.value, firstAndListName]
  );

  useLayoutEffect(() => setDisplayName(21), [setDisplayName]);

  return (
    donee && (
      <PolName
        headingSize={0}
        name={getShorterName}
        title={`Celebration for ${firstAndListName}`}
        cls={'form-text event-donee fs-6 mt-lg-1 mt-0 mb-lg-0 mb-1'}
      />
    )
  );
};
export default React.memo(Title);
