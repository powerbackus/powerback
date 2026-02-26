/**
 * BtcQrPlaceholder – 80x80 placeholder for BTC QR (error or loading).
 *
 * Styles live in Confirmation/style.css: .btc-qr-placeholder (base box),
 * .btc-qr-placeholder--error, .btc-qr-placeholder--loading.
 *
 * @module Confirmation/BtcQrPlaceholder
 * @param variant - 'error' (icon + optional title) or 'loading' (spinner)
 * @param title - Shown as title when variant is error (e.g. error message)
 * @returns Div with 80x80 flex box and variant-specific content
 */

import React from 'react';
import { Spinner } from 'react-bootstrap';

type Variant = 'error' | 'loading';

interface BtcQrPlaceholderProps {
  variant: Variant;
  /** Shown as title (e.g. error message) when variant is error */
  title?: string;
}

const BtcQrPlaceholder = ({ variant, title }: BtcQrPlaceholderProps) => {
  const className = [
    'btc-qr',
    'mt-1',
    'btc-qr-placeholder',
    variant === 'error' && 'btc-qr-placeholder--error',
    variant === 'loading' && 'btc-qr-placeholder--loading',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      title={title}
    >
      {variant === 'error' && (
        <i className='bi bi-exclamation-triangle text-danger' />
      )}
      {variant === 'loading' && <Spinner size='sm' />}
    </div>
  );
};

export default React.memo(BtcQrPlaceholder);
