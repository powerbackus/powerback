/**
 * Loading placeholder during auth initialization.
 * @module Loading
 */
import React from 'react';
import styles from './style.module.css';
import { Spinner } from 'react-bootstrap';

/**
 * Loading placeholder component shown during authentication initialization
 * Prevents the splash page from briefly appearing during refresh token process
 */
const Loading = ({ msg }: { msg: string }) => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingContent}>
      <Spinner
        animation='border'
        role='status'
        variant='warning'
      >
        <span className='visually-hidden'>Loading...</span>
      </Spinner>
      <p className={styles.loadingText}>{msg}</p>
    </div>
  </div>
);

export default React.memo(Loading);
