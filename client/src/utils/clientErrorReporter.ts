/**
 * @fileoverview Client-side error reporting helper.
 *
 * Provides a single entry point for reporting unexpected frontend errors to the
 * backend without leaking sensitive data. Intended for auth, payment, limits,
 * and other critical flows where we want visibility into failures in
 * production.
 *
 * In development this helper is a no-op; use `logError` / `logWarn` directly
 * for rich console diagnostics.
 *
 * @module utils/clientErrorReporter
 */

/**
 * Options for reporting a client-side error to the backend.
 */
export interface ClientErrorReportOptions {
  /**
   * High-level, non-sensitive description of what failed.
   * Example: 'Auth initialization error', 'Payment processing error'.
   */
  message: string;
  /**
   * Logical source of the error (hook, context, or component).
   * Example: 'AuthContext.initAuth', 'usePaymentProcessing.processDonation'.
   */
  context: string;
  /**
   * Additional safe metadata. Do not include raw request/response bodies,
   * tokens, or PII. Acceptable fields include HTTP status codes, route names,
   * and boolean flags.
   */
  extra?: Record<string, unknown>;
}

const isProd = process.env.NODE_ENV === 'production';

/**
 * Report a client-side error to the backend logging endpoint.
 *
 * In development this is a no-op. In production it sends a minimal payload
 * containing a high-level message, context, current URL, and any safe extra
 * metadata. It intentionally does NOT serialize the error object, stack,
 * request bodies, or response payloads.
 *
 * Fire-and-forget: callers do not need to await this function.
 */
export function reportClientError(options: ClientErrorReportOptions): void {
  if (!isProd) return;

  if (typeof fetch !== 'function') {
    return;
  }

  const payload = {
    message: options.message,
    context: options.context,
    extra: options.extra ?? {},
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  void fetch('/api/sys/errors/frontend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Deliberately ignore reporting failures to avoid error loops.
  });
}
