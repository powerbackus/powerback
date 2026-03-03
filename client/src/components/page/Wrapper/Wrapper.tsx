/**
 * Main content wrapper. Layout shell for pages.
 * @module Wrapper
 */
import React, { ReactNode } from 'react';
import './style.css';

type WrapperProps = {
  classProps: string;
  children: ReactNode;
};

const Wrapper = ({ children, classProps, ...props }: WrapperProps) => (
  <main
    id={'main-content'} // for accessibility skip links and main landmark
    className={classProps}
    tabIndex={-1}
    {...props}
  >
    {children}
  </main>
);

export default React.memo(Wrapper);
