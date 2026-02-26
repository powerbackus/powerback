/**
 * @fileoverview Celebration Events State Management Hook
 *
 * This hook manages the display, filtering, and sorting of user celebration/donation
 * events. It provides a reducer-based state management system for handling complex
 * event operations including sorting by date/amount, filtering by politician name/state,
 * and direction control.
 *
 * STATE STRUCTURE
 *
 * - events: Original reversed celebration list (newest first)
 * - sortedEvents: Currently sorted events (by date or amount)
 * - filteredEvents: Events after applying search filters
 * - sortDirection: 'ascending' | 'descending'
 * - sortType: 'date' | 'amount'
 *
 * ACTIONS
 *
 * INIT
 * - Resets to initial state with reversed celebrations
 * - Sets sort direction to 'descending' (newest first)
 * - Sets sort type to 'date'
 *
 * REVERSE
 * - Toggles sort direction (ascending ↔ descending)
 * - Reverses both sortedEvents and filteredEvents
 *
 * DATE
 * - Sorts events by creation date (createdAt field)
 * - Secondary sort by donation amount
 * - Respects current sort direction
 *
 * AMOUNT
 * - Sorts events by donation amount
 * - Secondary sort by creation date
 * - Respects current sort direction
 *
 * NAME
 * - Filters events by politician name (pol_name field)
 * - Case-insensitive search
 * - Returns empty array if no matches
 *
 * STATE
 * - Filters events by state (state field)
 * - Case-insensitive search
 * - Handled by NAME action with different key
 *
 * BUSINESS LOGIC
 *
 * SORTING PRIORITIES
 * - Date sort: ['createdAt', 'donation'] (date primary, amount secondary)
 * - Amount sort: ['donation', 'createdAt'] (amount primary, date secondary)
 *
 * FILTERING
 * - Whitespace-only queries return all events (no filter applied)
 * - Case-insensitive matching
 * - Filters applied to sortedEvents, result stored in filteredEvents
 *
 * DEPENDENCIES
 * - react: useCallback, useReducer, useMemo
 * - @Interfaces: Celebrations interface
 * - @Types: Celebration type
 * - lodash: _.sortBy for multi-field sorting
 *
 * @module hooks/data/useCelebrationEvents
 * @requires react
 * @requires @Interfaces
 * @requires @Types
 * @requires lodash
 */
import { useCallback, useReducer, Reducer, useMemo } from 'react';
import { Celebrations } from '@Interfaces';
import { Celebration } from '@Types';
import _ from 'lodash';

type Payload = string | undefined;

type Action = {
  type: string;
  payload?: Payload;
};

interface Handlers {
  setCelebrationEvents: (action: Action) => void;
}

export default function useCelebrationEvents(
  userCelebrations: Celebration[]
): [Celebrations, Handlers] {
  // Reverse celebrations to show newest first by default
  const reverse = (events: Celebration[]) => {
      return events.slice().reverse();
    },
    flipDonations = useMemo(
      () => reverse(userCelebrations),
      [userCelebrations]
    ),
    initCelebrationList: Celebrations = useMemo(
      () => ({
        events: flipDonations,
        sortedEvents: flipDonations,
        filteredEvents: flipDonations,
        sortDirection: 'descending',
        sortType: 'date',
      }),
      [flipDonations]
    );

  const reducer = useCallback(
    (state: Celebrations, action: Action) => {
      const eventsNow = state.filteredEvents;
      // Define sort field priorities for different sort types
      const sortsBy = {
          date: ['createdAt', 'donation'],
          amount: ['donation', 'createdAt'],
        },
        sortsTo = {
          inAscent: state.sortDirection === 'ascending',
          inDescent: state.sortDirection === 'descending',
        };

      // Helper to prevent empty whitespace from affecting filters
      const checkIfEmptyOrOnlyWhitespace = (query: string) => {
          return query.trim().length === 0;
        },
        filterByKey = (
          events: Celebration[],
          query: string,
          key: 'NAME' | 'STATE'
        ) => {
          if (checkIfEmptyOrOnlyWhitespace(query)) return events;
          else
            return (events as Celebration[]).filter((donation: Celebration) =>
              (
                donation[
                  (key === 'NAME' ? 'pol_name' : 'state') as keyof Celebration
                ] as string
              )
                .toLowerCase()
                .includes(query.toLowerCase())
            );
        };

      switch (action.type) {
        case 'INIT':
          return (state = initCelebrationList);
        case 'REVERSE':
          return {
            ...state,
            sortDirection: sortsTo.inDescent ? 'ascending' : 'descending',
            sortedEvents: reverse(state.sortedEvents),
            filteredEvents: reverse(eventsNow),
          };
        case 'DATE':
          return {
            ...state,
            sortType: 'date',
            sortedEvents: sortsTo.inDescent
              ? reverse(_.sortBy(state.sortedEvents, sortsBy.date))
              : _.sortBy(state.sortedEvents, sortsBy.date),
            filteredEvents: sortsTo.inDescent
              ? reverse(_.sortBy(eventsNow, sortsBy.date))
              : _.sortBy(eventsNow, sortsBy.date),
          };
        case 'AMOUNT':
          return {
            ...state,
            sortType: 'amount',
            sortedEvents: sortsTo.inDescent
              ? reverse(_.sortBy(state.sortedEvents, sortsBy.amount))
              : _.sortBy(state.sortedEvents, sortsBy.amount),
            filteredEvents: sortsTo.inDescent
              ? reverse(_.sortBy(eventsNow, sortsBy.amount))
              : _.sortBy(eventsNow, sortsBy.amount),
          };
        case 'NAME':
          return {
            ...state,
            filteredEvents: filterByKey(
              state.sortedEvents,
              action.payload as string,
              action.type
            ).length
              ? filterByKey(
                  state.sortedEvents,
                  action.payload as string,
                  action.type
                )
              : [],
          };
        default:
          throw new Error();
      }
    },
    [initCelebrationList]
  );

  const [state, dispatch] = useReducer<Reducer<Celebrations, Action>>(
    reducer,
    initCelebrationList as unknown as Celebrations
  );

  const handlers = useMemo<Handlers>(
    () => ({
      setCelebrationEvents: (action: Action) => dispatch(action),
    }),
    []
  );

  return [state, handlers];
}
