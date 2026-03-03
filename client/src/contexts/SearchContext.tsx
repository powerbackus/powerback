/**
 * Search context. Politician search by name, state, district; combobox state.
 * @module SearchContext
 */
import {
  useMemo,
  useContext,
  useReducer,
  useCallback,
  createContext,
  type PropsWithChildren,
} from 'react';
import type { HouseMember, RepState } from '@Interfaces';
import type { SearchLink } from '@CONSTANTS';
import type { ComboboxItem } from '@Types';
import { POLSTATES } from '@Tuples';
import { INIT } from '@CONSTANTS';

/**
 * Represents the available search categories and their display labels
 * @property {('Name'|'State'|'District')} value - Value identifier for the search option
 * @property {('NAME'|'STATE'|'DISTRICT')} name - Internal name for the search option
 * @property {('Searching by Name'|'Searching by State'|'Searching for District')} label - Display label for the search option
 */
export interface SearchOption {
  label: SearchLink['label'];
  value: SearchLink['value'];
  name: SearchLink['name'];
}

type ActiveSearchOption = 'options-link-active' | '';

export interface LinksClass {
  [key: string]: ActiveSearchOption;
}

/**
 * Represents the current state of the search context
 * @interface SearchState
 * @property {string} searchQuery - Current search query string
 * @property {string} showClearBtn - Current search query string
 * @property {boolean} isSearching - Whether a search operation is in progress
 * @property {ComboboxItem[]} items - List of items currently displayed in the search results
 * @property {LinksClass} linksClass - Classname for the active search option's link
 * @property {SearchOption} searchOption - Current search category (name, state, or district)
 * @property {HouseMember[]} initialItems - Initial list of items before any filtering is applied
 * @property {ComboboxItem|null} selectedItem - Currently selected item in the search results
 */
interface SearchState {
  searchQuery: string;
  isSearching: boolean;
  showClearBtn: string;
  items: ComboboxItem[];
  linksClass: LinksClass;
  searchOption: SearchOption;
  initialItems: HouseMember[];
  selectedItem: ComboboxItem | null;
}

/**
 * Actions that can be dispatched to update the search state
 * @type {Object} SearchActionType
 */
type SearchActionType =
  | { type: 'RESET' }
  | { type: 'SET_INITIAL_ITEMS'; payload: HouseMember[] }
  | { type: 'SET_SEARCH_OPTION'; payload: SearchOption }
  | { type: 'UPDATE_STATE'; payload: Partial<SearchState> };

/**
 * Interface defining the shape of the search context value
 * @interface SearchActions
 * @property {function(): void} resetSearch - Reset the search state to its initial values
 * @property {function(string): void} searchByName - Search function for finding politicians by name
 * @property {function(string): void} searchByState - Search function for finding politicians by state
 * @property {function(string): void} searchByDistrict - Search function for finding politicians by district
 * @property {function(string): void} setShowClearBtn - Set the show clear inputbutton state
 * @property {function(LinksClass): void} setLinksClass - Set the classname for the active search option's link
 * @property {function(SearchOption): void} setSearchOption - Set the current search category
 * @property {function(HouseMember[]): void} setInitialItems - Set the initial list of items for searching
 * @property {function(ComboboxItem|null): string} itemToString - Convert a search item to its string representation
 */
interface SearchActions {
  setSearchOption: (searchOption: SearchOption) => void;
  itemToString: (item: ComboboxItem | null) => string;
  setInitialItems: (items: HouseMember[]) => void;
  setLinksClass: (linksClass: LinksClass) => void;
  setShowClearBtn: (showClearBtn: string) => void;
  searchByState: (query: string) => void;
  searchByName: (query: string) => void;
  resetSearch: () => void;
}

/**
 * Initial state for the search context
 */
const initialState: SearchState = {
  linksClass: INIT.activeSearchOption,
  searchOption: INIT.searchOption,
  isSearching: false,
  selectedItem: null,
  initialItems: [],
  showClearBtn: '',
  searchQuery: '',
  items: [],
};

const SearchContext = createContext<SearchState & SearchActions>({
  ...initialState,
  resetSearch: () => {},
  itemToString: () => '',
  searchByName: () => {},
  searchByState: () => {},
  setLinksClass: () => {},
  setInitialItems: () => {},
  setSearchOption: () => {},
  setShowClearBtn: () => {},
});

/**
 * Provider component that wraps the application and provides search context
 * @param {PropsWithChildren} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to the search context
 * @returns {JSX.Element} SearchContext provider component
 */
export function SearchProvider({ children }: PropsWithChildren): JSX.Element {
  /**
   * Reducer function that handles state updates for the search context
   * @param {SearchState} state - Current search state
   * @param {SearchActionType} action - Action to be performed
   * @returns {SearchState} Updated search state
   */

  const searchReducer = useCallback(
    (state: SearchState, action: SearchActionType): SearchState => {
      switch (action.type) {
        case 'RESET':
          return {
            ...state,
            searchQuery: '',
            selectedItem: null,
            items: state.initialItems,
          };
        case 'SET_INITIAL_ITEMS':
          return {
            ...state,
            initialItems: action.payload,
            items: action.payload,
          };
        case 'SET_SEARCH_OPTION':
          return {
            ...state,
            searchOption: action.payload,
            items: [],
            showClearBtn: '',
          };
        case 'UPDATE_STATE':
          return { ...state, ...action.payload };
        default:
          return state;
      }
    },
    []
  );

  const [state, dispatch] = useReducer(searchReducer, initialState);

  /**
   * Converts a search item to its string representation based on the current category
   * @param {ComboboxItem|null} item - The item to convert to string
   * @returns {string} String representation of the item
   */
  const itemToString = useCallback(
    (item: ComboboxItem | null): string => {
      if (!item) return '';

      switch (state.searchOption.name) {
        case 'NAME':
          if (!(item as HouseMember).last_name) return '';
          return `${(item as HouseMember).last_name}, ${
            (item as HouseMember).first_name
          }`;
        case 'STATE':
          if (!(item as RepState).full) return '';
          return (item as RepState).full;
        case 'DISTRICT':
          return '';
        default:
          return '';
      }
    },
    [state.searchOption.name]
  );

  /**
   * Searches for politicians by name
   * @param {string} query - The search query string
   */
  const searchByName = useCallback(
    (query: string) => {
      dispatch({
        type: 'UPDATE_STATE',
        payload: { isSearching: true, searchQuery: query },
      });

      const filteredItems = state.initialItems
        .filter((pol) =>
          itemToString(pol)
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .includes(query.toLowerCase())
        )
        .sort((a, b) => a.first_name.localeCompare(b.first_name))
        .sort((a, b) => a.last_name.localeCompare(b.last_name));

      dispatch({
        type: 'UPDATE_STATE',
        payload: { items: filteredItems, isSearching: false },
      });
    },
    [state.initialItems, itemToString]
  );

  /**
   * Searches for politicians by state
   * @param {string} query - The search query string
   */
  const searchByState = useCallback(
    (query: string) => {
      dispatch({
        type: 'UPDATE_STATE',
        payload: { isSearching: true, searchQuery: query },
      });

      const statesWithReps = new Set(
        state.initialItems.map((pol) => pol.roles[0].state)
      );

      const filteredStates = POLSTATES.filter((POLSTATE: RepState) => {
        if (!statesWithReps.has(POLSTATE.abbrev)) return false;
        const searchString =
          `${POLSTATE.full} ${POLSTATE.abbrev}`.toLowerCase();
        const queryString = query.toLowerCase().trim();
        return searchString.includes(queryString);
      });

      dispatch({
        type: 'UPDATE_STATE',
        payload: { items: filteredStates, isSearching: false },
      });
    },
    [state.initialItems]
  );

  /**
   * Resets the search state to its initial values
   */
  const resetSearch = useCallback(() => dispatch({ type: 'RESET' }), []);

  /**
   * Sets the initial list of items for searching
   * @param {HouseMember[]} items - The initial list of house members
   */
  const setInitialItems = useCallback(
    (items: HouseMember[]) =>
      dispatch({ type: 'SET_INITIAL_ITEMS', payload: items }),
    []
  );

  /**
   * Sets the current search option
   * @param {SearchOption} option - The search option to set
   */
  const setSearchOption = useCallback(
    (option: SearchOption) =>
      dispatch({ type: 'SET_SEARCH_OPTION', payload: option }),
    []
  );

  /**
   * Sets the classname for the active search option's link
   * @param {LinksClass} linksClass - The classname to set
   */
  const setLinksClass = useCallback(
    (linksClass: LinksClass) =>
      dispatch({ type: 'UPDATE_STATE', payload: { linksClass } }),
    []
  );

  /**
   * Sets the show clear button state
   * @param {string} showClearBtn - The state to set
   */
  const setShowClearBtn = useCallback(
    (showClearBtn: string) =>
      dispatch({ type: 'UPDATE_STATE', payload: { showClearBtn } }),
    []
  );

  return (
    <SearchContext.Provider
      value={useMemo(
        () => ({
          ...state,
          resetSearch,
          itemToString,
          searchByName,
          searchByState,
          setLinksClass,
          setInitialItems,
          setSearchOption,
          setShowClearBtn,
        }),
        [
          state,
          resetSearch,
          itemToString,
          searchByName,
          searchByState,
          setLinksClass,
          setInitialItems,
          setSearchOption,
          setShowClearBtn,
        ]
      )}
    >
      {children}
    </SearchContext.Provider>
  );
}

/**
 * Hook to access the search context
 * @throws {Error} If used outside of a SearchProvider
 */
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
