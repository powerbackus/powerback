export const international = {
  width: (field, i, isMobile, isInternational) => {
    if (isInternational && field.name === 'country') return 7;
    else if (field.name === 'passport') return 5;
    else if (
      (!isInternational && field.name === 'country') ||
      field.name === 'isEmployed'
    ) {
      return 12;
    } else if (
      field.name === 'zip' ||
      field.name === 'state' ||
      field.name === 'address' ||
      field.name === 'city'
    ) {
      if (i % 2) {
        return isMobile ? 4 : 5;
      } else return isMobile ? 8 : 7;
    } else return 6;
  },
  show: (field, isInternational) => {
    if (field.name === 'passport') return isInternational;
    else return true;
  },
  label: (field, isInternational) => {
    const handleLabel = () => {
      if (field.name === 'zip' && isInternational) {
        return 'Postcode';
      } else return field.label;
    };
    const handleAsterisk = () => {
      if (
        field.required &&
        ((field.name === 'state' && !isInternational) ||
          field.name !== 'state')
      ) {
        return (
          <>
            {handleLabel()}
            <span className='req-asterisk'> *</span>
          </>
        );
      } else {
        return (
          <>
            {handleLabel()}
            <span style={{ fontSize: 'large', visibility: 'hidden' }}>
              {' '}
              *
            </span>
          </>
        );
      }
    };
    return handleAsterisk();
  },
  disable: (field, isInternational) => {
    if (field.name === 'state' && isInternational) {
      return true;
    } else return false;
  },
};
