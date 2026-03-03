/**
 * ContactUs – Support and billing contact info.
 *
 * @module Confirmation/content/ContactUs
 * @returns Paragraph with support email and details copy
 */

import React from 'react';
import { APP, CONFIRMATION_COPY } from '@CONSTANTS';

const ContactUs = () => (
  <p id='contact-us'>
    {CONFIRMATION_COPY.CONTACT_US.contact}{' '}
    <a href={`mailto:${APP.EMAIL.SUPPORT}`}>{APP.EMAIL.SUPPORT}</a>{' '}
    {CONFIRMATION_COPY.CONTACT_US.details}
  </p>
);

export default React.memo(ContactUs);
