/**
 * @fileoverview Politician Parade Display and Search Hook
 *
 * This hook manages the display and filtering of politicians in the "parade" view.
 * It provides search capabilities by name, state, and district (OCD ID) with
 * automatic sorting and filtering functionality. The parade view shows politicians
 * in a shuffled order for variety, with filtering options for targeted searches.
 *
 * STATE STRUCTURE
 *
 * - houseMembers: Complete list of all politicians (shuffled on init)
 * - applied: Currently filtered/displayed politicians
 *
 * ACTIONS
 *
 * INIT
 * - Initializes with shuffled politician list
 * - Shuffles for variety in display order
 * - Sets applied to all houseMembers
 *
 * NAME
 * - Filters to single politician by name
 * - Used for direct politician selection
 * - Returns array with single politician
 *
 * STATE
 * - Filters politicians by state abbreviation
 * - Sorts by district number using numeric collation
 * - Handles empty state abbreviations (shows all)
 *
 * DISTRICT
 * - Filters by specific congressional district (OCD ID)
 * - Matches politicians with matching ocd_id in roles[0]
 * - Used for location-based searches
 *
 * RESTORE
 * - Restores full politician list
 * - Sets applied to all houseMembers
 * - Clears all filters
 *
 * BUSINESS LOGIC
 *
 * SHUFFLING
 * - Initial list is shuffled using shuffle utility
 * - Provides variety in display order
 * - Shuffled once on initialization
 *
 * DISTRICT SORTING
 * - Uses Intl.Collator with numeric: true option
 * - Ensures proper numeric sorting (e.g., "2" before "10")
 * - Applied when filtering by state
 *
 * STATE FILTERING
 * - Filters by roles[0].state field
 * - Handles empty state abbreviations (shows all)
 * - Sorts results by district number
 *
 * DEPENDENCIES
 * - react: useCallback, useReducer, useMemo
 * - @Interfaces: PolsOnParade, HouseMember, RepState interfaces
 * - @Utils: shuffle utility function
 *
 * @module hooks/data/useParade
 * @requires react
 * @requires @Interfaces
 * @requires @Utils
 */
import { useCallback, useReducer, useMemo } from 'react';
import { PolsOnParade, HouseMember, RepState } from '@Interfaces';
import { shuffle } from '@Utils';

type Action = {
  payload?: HouseMember[] | HouseMember | RepState | string;
  type: string;
};

interface Handlers {
  setPolsOnParade: (houseMembers: HouseMember[]) => void;
  searchPolsByName: (selectedItem: HouseMember) => void;
  searchPolsByState: (selectedItem: RepState) => void;
  searchPolsByLocation: (ocd_id: string) => void;
  restorePolsOnParade: () => void;
}

export default function useParade(): [PolsOnParade, Handlers] {
  const reducer = useCallback((state: PolsOnParade, action: Action) => {
    switch (action.type) {
      case 'INIT':
        state = {
          ...state,
          houseMembers: shuffle(action.payload),
        };
        return (state = {
          ...state,
          applied: state.houseMembers,
        });
      case 'NAME':
        return (state = {
          ...state,
          applied: [action.payload as HouseMember] as HouseMember[],
        });
      case 'STATE':
        const collator = new Intl.Collator([], { numeric: true });
        return (state = {
          ...state,
          applied: state.houseMembers
            .filter(
              (pol: HouseMember) =>
                pol.roles[0].state ===
                ((action.payload as RepState).abbrev !== ''
                  ? (action.payload as RepState).abbrev
                  : pol.roles[0].state)
              // not to be confused with "50 stars for 50 states" 'STATE' or [Object].'state'
            )
            .sort((a: HouseMember, b: HouseMember) =>
              collator.compare(a.roles[0].district, b.roles[0].district)
            ),
        });
      case 'DISTRICT':
        return (state = {
          ...state,
          applied: state.houseMembers.filter(
            (pol: HouseMember) => pol.roles[0].ocd_id === action.payload
          ),
        });
      case 'RESTORE':
        return (state = {
          ...state,
          applied: state.houseMembers,
        });
      default:
        throw new Error();
    }
  }, []);

  const [state, dispatch] = useReducer(reducer, {
    applied: [],
    houseMembers: [],
  } as PolsOnParade);

  const handlers = useMemo<Handlers>(
    () => ({
      setPolsOnParade: (houseMembers) => {
        dispatch({ type: 'INIT', payload: houseMembers });
      },
      searchPolsByName: (selectedItem) => {
        dispatch({ type: 'NAME', payload: selectedItem });
      },
      searchPolsByState: (selectedItem) => {
        dispatch({ type: 'STATE', payload: selectedItem });
      },
      searchPolsByLocation: (ocd_id) => {
        dispatch({ type: 'DISTRICT', payload: ocd_id });
      },
      restorePolsOnParade: () => {
        dispatch({ type: 'RESTORE' });
      },
    }),
    []
  );
  return [state, handlers];
}
