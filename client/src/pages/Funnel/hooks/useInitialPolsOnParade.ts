/**
 * Fetches initial politician list on mount when parade is empty.
 * Uses a ref to avoid duplicate API calls in React StrictMode.
 *
 * @module pages/Funnel/hooks/useInitialPolsOnParade
 */

import { useRef, useEffect } from 'react';
import API from '@API';
import { logError } from '@Utils';
import type { HouseMember, PolsOnParade } from '@Interfaces';

type SetPolsOnParade = (houseMembers: HouseMember[]) => void;

/**
 * Ensures pols are fetched once when the parade is empty.
 * Call from Funnel; pass current parade state and setter from useParade().
 *
 * @param polsOnParade - Current parade state (only .applied.length is read); use PolsOnParade from useParade()
 * @param setPolsOnParade - Setter from useParade()
 */
export default function useInitialPolsOnParade(
  polsOnParade: PolsOnParade,
  setPolsOnParade: SetPolsOnParade
): void {
  const hasFetchedPols = useRef(false);

  useEffect(() => {
    if (polsOnParade.applied.length || hasFetchedPols.current) return;

    hasFetchedPols.current = true;

    API.getPols()
      .then(({ data }) => {
        setPolsOnParade(data);
      })
      .catch((error) => {
        logError('Failed to fetch pols', error);
        hasFetchedPols.current = false;
      });
  }, [setPolsOnParade, polsOnParade.applied.length]);
}
