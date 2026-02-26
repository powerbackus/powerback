/**
 * DemoCta – Demo-mode call-to-action block on Confirmation.
 * Explains that the flow was a demo and links to the full app.
 *
 * @module Confirmation/content/DemoCta
 */

import React from 'react';
import { ContinueBtn } from '@Components/buttons';

const FULL_APP_DOMAIN = process.env.REACT_APP_SHARED_DOMAIN ?? 'powerback.us';

const DEMO_FEATURES = [
  'Account, profile, and settings',
  'Real card donations (one-time or saved payment)',
  'Celebrations dashboard and receipt emails',
  'FEC compliance and per-candidate limits',
];

const DemoCta = () => (
  <section className='confirmation--demo-cta'>
    <h2 className='confirmation--demo-cta-title'>This was a demo</h2>
    <p className='confirmation--demo-cta-body'>
      Below is a preview of what you&apos;d see after a real donation.
    </p>
    <p className='confirmation--demo-cta-body'>
      The full app at{' '}
      <a
        href={`https://${FULL_APP_DOMAIN}`}
        rel='noopener noreferrer'
        target='_blank'
      >
        {FULL_APP_DOMAIN}
      </a>{' '}
      includes:
    </p>
    <ul className='confirmation--demo-cta-list'>
      {DEMO_FEATURES.map((feature, idx) => (
        <li key={idx}>{feature}</li>
      ))}
    </ul>
    <ContinueBtn
      handleClick={() => (window.location.href = `https://${FULL_APP_DOMAIN}`)}
      label={`Visit ${FULL_APP_DOMAIN.toLocaleUpperCase()}`}
      classProp={'button--continue'}
      variant={'outline-dark'}
      ariaPressed={false}
      type={'button'}
      size={'sm'}
    />
  </section>
);

export default React.memo(DemoCta);
