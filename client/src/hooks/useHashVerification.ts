/**
 * @fileoverview Hash Verification Hook
 *
 * This hook handles the common pattern of verifying hash-based links for
 * password resets, account activation, and email unsubscription. It extracts
 * hashes from URLs, calls API verification endpoints, and manages loading,
 * valid, and expired states.
 *
 * KEY FEATURES
 *
 * HASH EXTRACTION
 * - Uses regexMatchURI utility to extract hash from URL
 * - Supports different route types (reset, unsubscribe, activate)
 * - Handles special case: 'activate' routes use 'join' URL pattern
 *
 * VERIFICATION FLOW
 * 1. Extract hash from URL using regexMatchURI
 * 2. Call API verifyHash function with extracted hash
 * 3. Handle response based on route type
 * 4. Set appropriate state (isValid, isExpired)
 * 5. Call appropriate callback (onValid, onExpired, onInvalid)
 * 6. Redirect home on error or invalid hash
 *
 * ROUTE TYPE HANDLING
 * - 'reset'/'activate': Uses isHashConfirmed and isLinkExpired fields
 * - 'unsubscribe': Uses isValid and isExpired fields
 * - Different response shapes handled appropriately
 *
 * DUPLICATE PREVENTION
 * - Uses useRef to prevent duplicate API calls
 * - Only calls API once per component mount
 *
 * DEPENDENCIES
 * - react: useRef, useEffect, useState
 * - axios: AxiosResponse type
 * - @Utils: regexMatchURI utility
 *
 * @module hooks/useHashVerification
 * @requires react
 * @requires axios
 * @requires @Utils
 */

import { useRef, useEffect, useState } from 'react';
import { AxiosResponse } from 'axios';
import { logError, regexMatchURI } from '@Utils';

interface HashVerificationResult {
  isValid?: boolean;
  isExpired?: boolean;
  isHashConfirmed?: boolean;
  isLinkExpired?: boolean;
  [key: string]: unknown;
}

interface UseHashVerificationOptions {
  routeType: 'reset' | 'unsubscribe' | 'activate';
  verifyHash: (hash: string) => Promise<AxiosResponse<HashVerificationResult>>;
  onValid?: (data: HashVerificationResult) => void;
  onExpired?: (data: HashVerificationResult) => void;
  onInvalid?: () => void;
  onError?: () => void;
  homeLinkRedirect: () => void;
}

interface HashVerificationState {
  loading: boolean;
  isValid: boolean;
  isExpired: boolean;
  hash: string | null;
}

/**
 * Custom hook for verifying hash-based links (reset password, unsubscribe, etc.)
 *
 * This hook handles the common pattern of:
 * - Extracting hash from URL using regexMatchURI
 * - Calling API to verify hash validity
 * - Managing loading, valid, and expired states
 * - Redirecting home on error or invalid hash
 *
 * @param options - Configuration options for hash verification
 * @param options.routeType - The route type ('reset' | 'unsubscribe' | 'activate')
 * @param options.verifyHash - API function to verify the hash
 * @param options.onValid - Callback when hash is valid
 * @param options.onExpired - Callback when hash is expired
 * @param options.onInvalid - Callback when hash is invalid
 * @param options.onError - Callback when verification fails
 * @param options.homeLinkRedirect - Function to redirect to home
 * @returns Hash verification state
 *
 * @example
 * ```typescript
 * const [state] = useHashVerification({
 *   routeType: 'unsubscribe',
 *   verifyHash: (hash) => API.verifyUnsubscribeHash(hash),
 *   onValid: (data) => {
 *     setIsValid(data.isValid);
 *     setIsExpired(data.isExpired);
 *   },
 *   homeLinkRedirect: () => routes.main().replace(),
 * });
 * ```
 */
export default function useHashVerification({
  routeType,
  verifyHash,
  onValid,
  onExpired,
  onInvalid,
  onError,
  homeLinkRedirect,
}: UseHashVerificationOptions): HashVerificationState {
  const hasCalledAPI = useRef(false);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    // Prevent duplicate API calls
    if (hasCalledAPI.current) return;
    hasCalledAPI.current = true;

    const verify = async () => {
      try {
        // For 'activate' route type, extract hash from 'join' URL pattern
        // (emails use /join/:hash but we route to /activate)
        const matchType = routeType === 'activate' ? 'join' : routeType;
        const hashMatch = regexMatchURI(matchType);
        const [extractedHash] = hashMatch || [];

        if (!extractedHash) {
          logError(`Invalid ${routeType} URL: No hash found`);
          onInvalid?.();
          homeLinkRedirect();
          return;
        }

        setHash(extractedHash);

        const { data }: AxiosResponse<HashVerificationResult> =
          await verifyHash(extractedHash);

        // Handle different response shapes
        if (routeType === 'reset' || routeType === 'activate') {
          const isLinkExpired = data.isLinkExpired || false;
          const isHashConfirmed = data.isHashConfirmed || false;

          setIsExpired(isLinkExpired);
          setIsValid(isHashConfirmed);

          if (isLinkExpired) {
            onExpired?.(data);
          } else if (isHashConfirmed) {
            onValid?.(data);
          } else {
            onInvalid?.();
          }
        } else if (routeType === 'unsubscribe') {
          const valid = data.isValid || false;
          const expired = data.isExpired || false;

          setIsValid(valid);
          setIsExpired(expired);

          if (expired) {
            onExpired?.(data);
          } else if (valid) {
            onValid?.(data);
          } else {
            onInvalid?.();
          }
        }
      } catch (err) {
        logError(`${routeType} verification error`, err);
        onError?.();
        homeLinkRedirect();
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [
    routeType,
    verifyHash,
    onValid,
    onExpired,
    onInvalid,
    onError,
    homeLinkRedirect,
  ]);

  return {
    loading,
    isValid,
    isExpired,
    hash,
  };
}
