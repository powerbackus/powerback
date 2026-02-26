import React, { useMemo } from 'react';
import { StyledModal } from '@Components/modals';
import { Body, Heading } from './subcomps';
import { useDevice } from '@Contexts';
import { Tab } from 'react-bootstrap';

const FAQModal = () => {
  const { isMobile } = useDevice();

  const handleHeading = useMemo(
    () => 'display-' + (isMobile ? '7' : '5'),
    [isMobile]
  );

  return (
    <Tab.Container defaultActiveKey='FAQ-event-1'>
      <StyledModal
        heading={<Heading handleHeading={handleHeading} />}
        closeButton={true}
        body={<Body />}
        type={'FAQ'}
      />
    </Tab.Container>
  );
};

export default React.memo(FAQModal);
