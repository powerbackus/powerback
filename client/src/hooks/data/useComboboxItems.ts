/**
 * @fileoverview Combobox Items Search and Filter Hook
 *
 * This hook manages search and filtering for combobox components, primarily used
 * for politician and state selection. It provides real-time filtering with
 * accent-insensitive search and maintains sorted results for better UX.
 *
 * KEY FEATURES
 *
 * ACCENT-INSENSITIVE SEARCH
 * - Uses Unicode normalization (NFD) to remove diacritics
 * - Allows searching "José" by typing "jose"
 * - Case-insensitive matching
 * - Applied to both politician names and state names
 *
 * STATE FILTERING
 * - Only shows states that have representatives
 * - Filters from POLSTATES tuple based on actual representatives
 * - Searches both state name and abbreviation
 * - Maintains state list integrity
 *
 * NAME FILTERING
 * - Filters politicians by name (first + last name)
 * - Sorts by first name, then last name
 * - Real-time filtering as user types
 *
 * SEARCH CATEGORIES
 *
 * NAME
 * - Filters politicians by name
 * - Sorts by first name, then last name
 * - Accent-insensitive matching
 *
 * STATE
 * - Filters states that have representatives
 * - Searches state name and abbreviation
 * - Only shows states with actual representatives
 *
 * DISTRICT
 * - Placeholder for future district filtering
 * - Currently returns state unchanged
 *
 * RESET
 * - Restores original list
 * - Clears all filters
 * - Returns to initial state
 *
 * BUSINESS LOGIC
 *
 * UNICODE NORMALIZATION
 * - Uses normalize('NFD') to decompose characters
 * - Removes diacritics with /\p{Diacritic}/gu regex
 * - Enables accent-insensitive search
 *
 * STATE FILTERING LOGIC
 * - Creates Set of states with representatives from init array
 * - Filters POLSTATES to only include states in Set
 * - Then applies search query filter
 *
 * DEPENDENCIES
 * - react: useCallback, useReducer, useMemo
 * - @Interfaces: HouseMember, RepState interfaces
 * - @Types: ComboboxItem type
 * - @Tuples: POLSTATES tuple
 *
 * @module hooks/data/useComboboxItems
 * @requires react
 * @requires @Interfaces
 * @requires @Types
 * @requires @Tuples
 */
import { useCallback, useReducer, useMemo } from 'react';
import { HouseMember, RepState } from '@Interfaces';
import { ComboboxItem } from '@Types';
import { POLSTATES } from '@Tuples';

type ActionPayload = {
  value: ComboboxItem;
  searchQuery?: string;
};

type Action = {
  type: string;
  payload?: ActionPayload;
};

interface Handlers {
  setInputItems: (value: ComboboxItem[]) => void;
  resetSearchBar: () => void;
}

export default function useComboboxItems(
  itemToString: (item: ComboboxItem | null) => string,
  init: HouseMember[],
  category: string
): [ComboboxItem[], Handlers] {
  const reducer = useCallback(
    (state: ComboboxItem[], action: Action) => {
      switch (action.type) {
        case 'NAME':
          return (state = init
            .filter((pol) =>
              (itemToString(pol as HouseMember) as string)
                .toLowerCase()
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '') // Remove diacritics for accent-insensitive search
                .includes((action.payload?.searchQuery || '').toLowerCase())
            )
            .sort((a, b) => a.first_name.localeCompare(b.first_name))
            .sort((a, b) => a.last_name.localeCompare(b.last_name)));
        case 'STATE': {
          // Get unique states from polsOnParade
          const statesWithReps = new Set(
            init.map((pol: HouseMember) => pol.roles[0].state)
          );

          return (state = POLSTATES.filter((POLSTATE: RepState) => {
            // First check if the state has any representatives
            if (!statesWithReps.has(POLSTATE.abbrev)) return false;

            // Then check if it matches the search query
            return (itemToString(POLSTATE) + POLSTATE.abbrev)
              .toLowerCase()
              .includes(
                (action.payload?.searchQuery || '').toLowerCase().trim()
              );
          }));
        }
        case 'DISTRICT': {
          return state;
        }
        case 'RESET':
          return (state = init);
        default: {
          throw new Error();
        }
      }
    },
    [itemToString, init]
  );

  const [state, dispatch] = useReducer(reducer, init);

  const handlers = useMemo<Handlers>(
    () => ({
      setInputItems: (value: ComboboxItem[]) =>
        dispatch({
          type: category,
          payload: {
            value: value as unknown as ComboboxItem,
            searchQuery: value as unknown as string,
          },
        } as unknown as Action),
      resetSearchBar: () => dispatch({ type: 'RESET' }),
    }),
    [category]
  );

  return [state, handlers];
}
