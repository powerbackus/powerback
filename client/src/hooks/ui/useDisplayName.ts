/**
 * @fileoverview Display Name Formatting Hook
 *
 * This hook calculates the optimal display format for politician names based on
 * available space (maxLen). It provides a progressive fallback system that
 * shortens names while preserving readability, with responsive calculations
 * for mobile and desktop devices.
 *
 * KEY FEATURES
 *
 * PROGRESSIVE NAME FORMATTING
 * - Full name: "First Middle Last" (if fits)
 * - First M. Last: "First M. Last" (if middle name available)
 * - F. Middle Last: "F. Middle Last" (if middle name available)
 * - F. M. Last: "F. M. Last" (if middle name available)
 * - F. Last: "F. Last" (fallback)
 * - Last: "Last" (final fallback)
 *
 * RESPONSIVE CALCULATIONS
 * - Different font size calculations for mobile vs desktop
 * - Mobile uses larger multipliers for better readability
 * - Desktop uses smaller multipliers for compact display
 *
 * POSITION CALCULATIONS
 * - Calculates x and y positions based on name length
 * - Uses magic number formulas for positioning
 * - Responsive to device type (mobile vs desktop)
 *
 * BUSINESS LOGIC
 *
 * NAME FORMAT PRIORITY
 * 1. Full name (if fits within maxLen)
 * 2. First M. Last (if middle name and fits)
 * 3. F. Middle Last (if middle name and fits)
 * 4. F. M. Last (if middle name and fits)
 * 5. F. Last (fallback)
 * 6. Last (final fallback)
 *
 * MAGIC NUMBER FORMULAS
 * - x position: Based on name length with device multiplier
 * - y position: Complex formula with length, device multiplier, and constants
 * - Formulas tuned for optimal text positioning
 *
 * MIDDLE NAME HANDLING
 * - Checks if middle name exists and has length > 0
 * - Only uses middle name formats if middle name available
 * - Falls back to F. Last format if no middle name
 *
 * DEPENDENCIES
 * - react: useCallback, useReducer, useMemo
 * - @Interfaces: DisplayName interface
 * - @Contexts: useDevice hook
 *
 * @module hooks/ui/useDisplayName
 * @requires react
 * @requires @Interfaces
 * @requires @Contexts
 */

import { useCallback, useReducer, useMemo } from 'react';
import { DisplayName } from '@Interfaces';
import { useDevice } from '@Contexts';

interface Names {
  hasMiddle: boolean;
  fil: string;
  iml: string;
  iil: string;
  il: string;
}

interface Handlers {
  setDisplayName: (maxLen: number) => void;
}

type Props = {
  middle?: string;
  first: string;
  last: string;
};

const MAGIC = {
  e: 0.00261,
  c: 0.0424,
  m: -0.75,
  d: 0.33,
  b: 10,
  f: 1,
  x: 2,
  l: 3,
};

export default function useDisplayName({
  first,
  middle,
  last,
}: Props): [DisplayName, Handlers] {
  const { isMobile } = useDevice();

  const isMiddleNamed = useMemo(
      () => middle && (middle as string).length > 0,
      [middle]
    ),
    fullName = useMemo(
      () => first + ' ' + (isMiddleNamed && middle + ' ') + last,
      [first, middle, last, isMiddleNamed]
    ),
    fLast = useMemo(() => first.substring(0, 1) + '. ' + last, [first, last]),
    names = useMemo(
      () => ({
        // a progression of how names should be displayed:
        fil:
          (isMiddleNamed &&
            first + ' ' + (middle as string).substring(0, 1) + '. ' + last) ||
          fLast, // First M. Last
        iml:
          (isMiddleNamed &&
            first.substring(0, 1) + '. ' + middle + ' ' + last) ||
          fLast, // F. Middle Last
        iil:
          (isMiddleNamed &&
            first.substring(0, 1) +
              '. ' +
              (middle as string).substring(0, 1) +
              '. ' +
              last) ||
          fLast, // F. M. Last
        il: fLast, // F. Last
      }),
      [first, middle, last, isMiddleNamed, fLast]
    ),
    doesFit = useCallback(
      (type: keyof Names, maxLen: number) => {
        return ((names as Names)[type] as string).length <= maxLen;
      },
      [names]
    ),
    reducer = useCallback(
      (state: DisplayName, maxLen: number) => {
        function x(value: string) {
          return (
            MAGIC.b *
              (1 / (value as string).length) *
              (isMobile ? MAGIC.f : MAGIC.d) +
            'vw'
          );
        }
        function y(value: string) {
          return (
            (MAGIC.m -
              MAGIC.c * (value as string).length +
              MAGIC.e * (value as string).length ** MAGIC.x) *
              (isMobile ? MAGIC.l : MAGIC.f) +
            'vw'
          );
        }
        const value =
          fullName.replace('  ', '').length <= maxLen
            ? fullName
            : isMiddleNamed
              ? doesFit('fil', maxLen)
                ? names.fil
                : doesFit('iml', maxLen)
                  ? names.iml
                  : doesFit('iil', maxLen)
                    ? names.iil
                    : last
              : doesFit('il', maxLen)
                ? names.il
                : last;

        state = { value: value, x: x(value), y: y(value) };
        return state;
      },
      [last, names, isMobile, fullName, isMiddleNamed, doesFit]
    );

  const [state, dispatch] = useReducer(reducer, {
      value: '',
      x: '0',
      y: '0',
    }),
    handlers = useMemo<Handlers>(
      () => ({
        setDisplayName: (maxLen) => dispatch(maxLen),
      }),
      []
    );

  return [state, handlers];
}
