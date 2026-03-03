/**
 * MagicLink wrapper. Hash verification for reset, unsubscribe, activate.
 * @module MagicLink
 */
import React, { useEffect, ReactNode } from 'react';
import { Col, Row, Card, Spinner, Container } from 'react-bootstrap';
import { useHashVerification } from '@Hooks';
import { AxiosResponse } from 'axios';
import './style.css';

interface HashVerificationResult {
  isHashConfirmed?: boolean;
  isLinkExpired?: boolean;
  isExpired?: boolean;
  isValid?: boolean;
  [key: string]: unknown;
}

interface MagicLinkProps {
  /**
   * Route type for hash verification
   */
  routeType: 'reset' | 'unsubscribe' | 'activate';

  /**
   * API function to verify the hash
   */
  verifyHash: (hash: string) => Promise<AxiosResponse<HashVerificationResult>>;

  /**
   * Callback when hash is expired
   */
  onExpired?: (data: HashVerificationResult) => void;

  /**
   * Callback when hash is valid
   */
  onValid?: (data: HashVerificationResult) => void;

  /**
   * Function to redirect to home page
   */
  homeLinkRedirect: () => void;

  /**
   * Callback when hash is invalid
   */
  onInvalid?: () => void;

  /**
   * Callback when verification fails
   */
  onError?: () => void;

  /**
   * Container ID for CSS targeting
   */
  containerId: string;

  /**
   * Additional CSS classes for Card.Body
   */
  cardBodyClassName?: string;

  /**
   * Render function that receives hash verification state
   * @param props - Hash verification state and utilities
   * @param props.isExpired - Whether hash is expired
   * @param props.isValid - Whether hash is valid
   * @param props.loading - Whether verification is in progress
   * @param props.hash - Verified hash string or null
   */
  children: (props: {
    hash: string | null;
    isExpired: boolean;
    isValid: boolean;
    loading: boolean;
  }) => ReactNode;

  /**
   * Optional: Additional redirect conditions
   * If this returns true, the component will redirect to home
   */
  shouldRedirect?: (props: {
    hash: string | null;
    isExpired: boolean;
    isValid: boolean;
    loading: boolean;
  }) => boolean;
}

/**
 * MagicLink - Shared wrapper component for hash-based magic link pages
 *
 * This component provides a consistent structure and behavior for pages that
 * use hash-based verification (password reset, unsubscribe, etc.).
 *
 * Features:
 * - Automatic hash verification using useHashVerification hook
 * - Loading state with spinner
 * - Automatic redirect on invalid/expired links
 * - Shared UI structure (Container, Row, Col, Card)
 * - Flexible content rendering via render prop
 *
 * @example
 * ```tsx
 * <MagicLink
 *   routeType="reset"
 *   verifyHash={(hash) => API.confirmResetPasswordHash(hash)}
 *   onValid={(data) => setUserIsAssumedValid(data.isHashConfirmed)}
 *   onExpired={(data) => setLinkIsExpired(data.isLinkExpired)}
 *   homeLinkRedirect={homeLinkRedirect}
 *   containerId="reset-container"
 *   shouldRedirect={(props) => !props.isValid || props.isExpired}
 * >
 *   {({ hash, isValid, isExpired, loading }) => {
 *     if (loading) return <Spinner />;
 *     if (!isValid || isExpired) return null;
 *     return <ResetForm hash={hash} />;
 *   }}
 * </MagicLink>
 * ```
 */
const MagicLink = ({
  onError,
  onValid,
  children,
  onExpired,
  onInvalid,
  routeType,
  verifyHash,
  containerId,
  shouldRedirect,
  homeLinkRedirect,
  cardBodyClassName = '',
}: MagicLinkProps) => {
  const { loading, hash, isValid, isExpired } = useHashVerification({
    homeLinkRedirect,
    verifyHash,
    routeType,
    onExpired,
    onInvalid,
    onError,
    onValid,
  });

  // Default redirect logic: redirect if invalid or expired
  const defaultShouldRedirect = !isValid || isExpired;
  const willRedirect = shouldRedirect
    ? shouldRedirect({ hash, isValid, isExpired, loading })
    : defaultShouldRedirect;

  // Redirect to home if link is invalid or expired
  useEffect(() => {
    if (!loading && willRedirect) {
      homeLinkRedirect();
    }
  }, [loading, willRedirect, homeLinkRedirect]);

  // Show loading spinner while verifying
  if (loading) {
    return (
      <Container className='d-flex'>
        <Spinner
          animation='border'
          variant='light'
        />
      </Container>
    );
  }

  // Return null if redirecting (prevents flash of content)
  if (willRedirect) {
    return null;
  }

  // Render children with hash verification state
  return (
    <Container
      id={containerId}
      className={'magic-link-page'}
      fluid
    >
      <Row className='secureuserpass--row d-flex justify-content-center align-items-center'>
        <Col
          lg={12}
          className='secureuserpass--field mt-lg-5 pt-lg-5'
        >
          <Card className='magic-user-interaction'>
            <Card.Body
              className={`special-invalid ${cardBodyClassName}`.trim()}
            >
              {children({ hash, isValid, isExpired, loading })}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default React.memo(MagicLink);
