/**
 * @fileoverview Cookie consent banner component for Google Analytics opt-in
 *
 * Manages user consent for analytics cookies. Default consent (denied) is set
 * in index.html before gtag loads; this component overrides it on mount for
 * returning users who previously accepted, and on Accept/Decline.
 *
 * @module CookieConsent
 */

import React, { useState, useEffect } from 'react';
import { COOKIE_CONSENT_COPY } from '@CONSTANTS';
import { Alert, Button } from 'react-bootstrap';
import { TRACKING } from '@CONSTANTS';
import './style.css';

// Google Analytics tracking ID from constants
const GTAG_ID = TRACKING.GTAG_ID;
// GA disable flag key - setting this to true prevents GA from loading/executing
const GTAG_DISABLE_KEY = 'ga-disable-' + GTAG_ID;

// Extend the window interface for Google Analytics global functions
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

/** GA disable flag is set on window by key; use setGtagDisable/getGtagDisable to avoid index signature issues */
function setGtagDisable(key: string, value: boolean): void {
  (window as unknown as Record<string, boolean>)[key] = value;
}

/**
 * CookieConsent component
 *
 * Displays a consent banner for Google Analytics cookies. Manages GA
 * initialization state based on user's stored preference. Implements opt-in
 * consent model where analytics are disabled by default.
 *
 * @returns {JSX.Element | null} Cookie consent banner or null if not shown
 */
const CookieConsent = () => {
  const [show, setShow] = useState(false);

  /**
   * Override default consent (set in index.html) based on stored user preference.
   * Runs within wait_for_update window so gtag respects the update before first hit.
   */
  useEffect(() => {
    const cookieChoice = localStorage.getItem('pb:cookieConsent');

    if (cookieChoice === null) {
      setShow(true);
      setGtagDisable(GTAG_DISABLE_KEY, true);
    } else if (cookieChoice === 'accepted') {
      setGtagDisable(GTAG_DISABLE_KEY, false);
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      }
    }
  }, []);

  /**
   * Handle user acceptance of analytics cookies
   *
   * Stores acceptance in localStorage, enables GA, updates consent mode, and
   * deletes any existing GA cookies to ensure clean state before re-initialization.
   */
  const handleAccept = () => {
    // Persist user's consent choice
    localStorage.setItem('pb:cookieConsent', 'accepted');
    // Enable Google Analytics by removing disable flag
    setGtagDisable(GTAG_DISABLE_KEY, false);
    // Update GA consent mode to grant analytics storage
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
    // Delete any existing GA cookies to ensure clean state before GA re-initializes
    // This prevents stale cookies from persisting after consent change
    document.cookie.split(';').forEach(function (c) {
      if (c.trim().startsWith('_ga')) {
        const cookieName = c.split('=')[0];
        // Expire cookie immediately by setting expiration to past date
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    setShow(false);
  };

  /**
   * Handle user decline of analytics cookies
   *
   * Stores decline in localStorage, disables GA, updates consent mode to denied,
   * and deletes any existing GA cookies for compliance.
   */
  const handleDecline = () => {
    // Persist user's decline choice
    localStorage.setItem('pb:cookieConsent', 'declined');
    // Disable Google Analytics by setting disable flag
    setGtagDisable(GTAG_DISABLE_KEY, true);
    // Update GA consent mode to deny analytics storage
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
    // Delete any existing GA cookies for compliance when user declines
    document.cookie.split(';').forEach(function (c) {
      if (c.trim().startsWith('_ga')) {
        const cookieName = c.split('=')[0];
        // Expire cookie immediately by setting expiration to past date
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    setShow(false);
  };

  // Early return if banner should not be shown
  if (!show) return null;

  return (
    <div className='cookie-consent-banner'>
      <Alert variant='dark'>
        <div className='d-flex align-items-center flex-column'>
          <p className='mb-3'>{COOKIE_CONSENT_COPY.BANNER.message}</p>
          <div className='d-flex gap-2 justify-content-end flex-column flex-md-row'>
            <Button
              variant={'outline-secondary'}
              onClick={handleDecline}
              size={'sm'}
            >
              {COOKIE_CONSENT_COPY.BANNER.essentialOnly}
            </Button>
            <Button
              variant={'outline-light'}
              onClick={handleAccept}
              size={'sm'}
            >
              {COOKIE_CONSENT_COPY.BANNER.acceptAnalytics}
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default React.memo(CookieConsent);
