/**
 * @fileoverview Helper for deriving user-facing error messages from HTTP status codes.
 *
 * Uses the shared ERRORS tuple so UI components and hooks can map status codes
 * to consistent copy without duplicating switch statements.
 *
 * @module utils/errorMessage
 */

import { ERRORS } from '@Tuples';
import type { HttpStatusCode } from 'axios';

interface ErrorTuple {
  status: HttpStatusCode;
  icon: string;
  msg: string;
}

/**
 * Look up the error tuple (icon + message) for a given HTTP status code.
 *
 * @param status - HTTP status code (e.g. 400, 401, 422)
 * @returns Matching error tuple or undefined if status is not mapped
 */
export function getErrorTupleForStatus(
  status?: number | null
): ErrorTuple | undefined {
  if (typeof status !== 'number') return undefined;
  return (ERRORS as ErrorTuple[]).find((entry) => entry.status === status);
}

/**
 * Derive a user-facing error message from an HTTP status code, falling back
 * to a generic message when the status is not mapped.
 *
 * @param status - HTTP status code (e.g. 400, 401, 422)
 * @param fallbackMessage - Optional fallback when no tuple is found
 * @returns Error message string suitable for display to end users
 */
export function getStatusErrorMessage(
  status?: number | null,
  fallbackMessage = ' Something went wrong. Please try again.'
): string {
  const tuple = getErrorTupleForStatus(status);
  return tuple?.msg ?? fallbackMessage;
}
