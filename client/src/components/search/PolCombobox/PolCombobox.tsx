/**
 * Politician combobox. Search by name/state/district, downshift.
 * @module PolCombobox
 */
import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Form, Badge, Spinner, InputGroup } from 'react-bootstrap';
import { useDevice, useSearch, useDonationState } from '@Contexts';
import { useCombobox, UseComboboxStateChange } from 'downshift';
import { handleKeyDown, logWarn, transformPolData } from '@Utils';
import type { ComboboxItem, UserEvent } from '@Types';
import { INIT, SEARCH_COPY } from '@CONSTANTS';
import API from '@API';
import {
  type PolsOnParade,
  type HouseMember,
  type Location,
  type RepState,
} from '@Interfaces';
import './style.css';

/**
 * PolCombobox - A sophisticated search component for finding politicians
 *
 * This component provides three search modes:
 * - NAME: Search politicians by name
 * - STATE: Search by state
 * - DISTRICT: Search by address/location to find district representatives
 *
 * Features:
 * - Autocomplete dropdown with keyboard navigation
 * - Location-based district lookup with geocoding
 * - Incumbent vs challenger detection
 * - Responsive design (desktop vs mobile)
 * - Loading states and error handling
 */
export type PolComboboxProps = {
  searchPolsByLocation?: (ocd_id: string) => void;
  restorePolsOnParade?: () => void;
  searchPolsByState?: (selectedItem: RepState) => void;
  searchPolsByName?: (selectedItem: HouseMember) => void;
  polsOnParade?: PolsOnParade;
};

const PolCombobox = ({
  searchPolsByLocation,
  restorePolsOnParade,
  searchPolsByState,
  searchPolsByName,
  polsOnParade,
}: PolComboboxProps) => {
  // Search context provides items, search options, and search methods
  const {
      items, // Current filtered items for dropdown
      searchOption, // Current search mode (NAME/STATE/DISTRICT)
      showClearBtn, // Input value for controlled input
      itemToString, // Function to convert item to display string
      searchByName, // Search method for name-based search
      searchByState, // Search method for state-based search
      setInitialItems, // Set initial items from parade data
      setShowClearBtn, // Update input value
    } = useSearch(),
    { isDesktop } = useDevice(), // Device context for responsive behavior
    { resetSelectedPol, selectPol, selectedPol, polData } = useDonationState(); // Donation state for selected candidate

  // Selected item state (currently unused but required by downshift)
  const [selectedItem] = useState(null);

  // Loading state for location-based searches
  const [isFinding, setIsFinding] = useState(false);

  // Initialize search context with parade data when component mounts
  // This populates the initial dropdown with all house members
  useEffect(() => {
    if (polsOnParade?.houseMembers) {
      setInitialItems(polsOnParade.houseMembers);
    }
  }, [polsOnParade?.houseMembers, setInitialItems]);

  // Reset location fetch flag when input changes
  useEffect(() => {
    hasFetchedLocation.current = false;
  }, [showClearBtn]);

  // Clear selection if selected candidate is filtered out of carousel
  useEffect(() => {
    if (selectedPol && polsOnParade?.applied) {
      const isSelectedCandidateVisible = polsOnParade.applied.some(
        (pol) => pol.id === selectedPol
      );
      if (!isSelectedCandidateVisible) {
        // Selected candidate is no longer in the filtered carousel - clear selection
        resetSelectedPol();
      }
    }
  }, [polsOnParade?.applied, selectedPol, resetSelectedPol]);

  // Format candidate name for badge display
  // Note: this doubles as proof of a candidate being selected even if they are not in the carousel
  const candidateName = useMemo(() => {
    if (!selectedPol || !polData || !polData.id) return null;
    return (
      polData.name ||
      `${polData.first_name || ''} ${polData.last_name || ''}`.trim()
    );
  }, [selectedPol, polData]);

  /**
   * Gate for single-pol auto-select: true only while we are in "one pol in
   * carousel, auto-selected" state. Cleared when user clears selection via
   * badge X or when parade widens, so we don't re-auto-select on the next
   * render and can tell "user chose to clear" from "no selection yet".
   */
  const singlePolParadeGate = useRef<boolean>(false);

  /**
   * Clear selection from the badge X: drop the gate, reset donation state
   * selection, and restore full parade so the carousel shows all pols again.
   */
  const handleCloseSelectedPolBadge = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      singlePolParadeGate.current = false;
      resetSelectedPol();
      (restorePolsOnParade as () => void)();
    },
    [resetSelectedPol, restorePolsOnParade]
  );

  /**
   * When the gate is set (we auto-selected the single pol): keep selection
   * in sync if parade still has one pol; if parade widens or selection was
   * cleared elsewhere, clear the gate and restore full parade.
   */
  useEffect(() => {
    if (!singlePolParadeGate.current) return;
    if (
      (polsOnParade?.applied?.length || 0) > 1 ||
      (!selectedPol && !candidateName)
    ) {
      singlePolParadeGate.current = false;
      (restorePolsOnParade as () => void)();
    } else if (polsOnParade?.applied?.length === 1) {
      selectPol(transformPolData(polsOnParade.applied[0]));
      singlePolParadeGate.current = true;
    }
  }, [
    selectedPol,
    candidateName,
    singlePolParadeGate,
    polsOnParade?.applied,
    restorePolsOnParade,
    selectPol,
  ]);

  // Auto-select when search narrows to a single pol (e.g. Name + District)
  useEffect(() => {
    if (
      polsOnParade?.applied?.length === 1 &&
      !selectedPol &&
      !candidateName &&
      !singlePolParadeGate.current
    ) {
      selectPol(transformPolData(polsOnParade.applied[0]));
      singlePolParadeGate.current = true;
    }
  }, [
    polsOnParade?.applied,
    singlePolParadeGate,
    candidateName,
    selectedPol,
    selectPol,
  ]);

  /**
   * Handles input value changes and triggers appropriate search
   *
   * When input is empty: restores original parade data
   * When input has value: performs search based on current search option
   */
  const handleInputValueChange: (
    changes: UseComboboxStateChange<ComboboxItem>
  ) => void = useCallback(
    ({ inputValue }) => {
      if (inputValue === '') {
        // Clear search and restore original data
        (restorePolsOnParade as () => void)();
      } else {
        // Perform search based on current search mode
        switch (searchOption.name) {
          case 'NAME':
            searchByName(inputValue || '');
            break;
          case 'STATE':
            searchByState(inputValue || '');
            break;
          case 'DISTRICT':
            // Skip search for district mode - only update input value
            break;
        }
      }
      // Update input value for controlled component
      (setShowClearBtn as Dispatch<SetStateAction<string>>)(
        inputValue ? inputValue : ''
      );
    },
    [
      searchByName,
      searchByState,
      setShowClearBtn,
      restorePolsOnParade,
      searchOption.name,
    ]
  );

  /**
   * Handles item selection from dropdown
   *
   * Triggers appropriate search action based on selected item type:
   * - HouseMember for name searches
   * - RepState for state searches
   */
  const handleSelectedItemChange: (
    changes: UseComboboxStateChange<ComboboxItem>
  ) => void = useCallback(
    ({ selectedItem }) => {
      if (searchOption.name === 'NAME')
        (searchPolsByName as (selectedItem: HouseMember) => void)(
          selectedItem as HouseMember
        );
      else if (searchOption.name === 'STATE')
        (searchPolsByState as (selectedItem: RepState) => void)(
          selectedItem as RepState
        );
    },
    [searchPolsByName, searchPolsByState, searchOption.name]
  );

  // Downshift combobox hook for dropdown functionality
  const {
    isOpen, // Whether dropdown is open
    getItemProps, // Props for dropdown items
    getMenuProps, // Props for dropdown menu
    getInputProps, // Props for input field
    getLabelProps, // Props for label
    highlightedIndex, // Currently highlighted item index
  } = useCombobox({
    itemToString,
    selectedItem,
    items: items,
    onInputValueChange: handleInputValueChange,
    onSelectedItemChange: handleSelectedItemChange as (
      changes: UseComboboxStateChange<ComboboxItem>
    ) => void,
  });

  /**
   * Checks if an incumbent has challengers and handles the search accordingly
   *
   * If incumbent exists in parade data: searches by location
   * If no incumbent: shows alert and parses district info for user
   */
  const incumbentHasNoChallenger = useCallback(
    (ocd_id: string) => {
      // Check if incumbent exists in current parade data
      if (
        (polsOnParade as PolsOnParade).houseMembers.filter(
          (pol) => pol.roles[0].ocd_id === ocd_id
        ).length
      ) {
        // Incumbent exists - search by location
        (searchPolsByLocation as (ocd_id: string) => void)(ocd_id);
      } else {
        // No incumbent - parse district info and show alert
        function parseOcdId(ocd_id: string) {
          const stateMatch = ocd_id.match(/state:([a-z]{2})/);
          const districtMatch = ocd_id.match(/cd:(\d+)/);

          return {
            state: (stateMatch as RegExpMatchArray)[1].toUpperCase(),
            district: Number((districtMatch as RegExpMatchArray)[1]),
          };
        }
        const { state, district } = parseOcdId(ocd_id);

        function makeAlert(MSG_ARR: string[]) {
          let msg = `${MSG_ARR[0]} ${district} ${MSG_ARR[1]} ${state} ${MSG_ARR[2]}`;
          return alert(msg);
        }
        makeAlert(SEARCH_COPY.SEARCH.DISTRICT.NO_CHALLENGER);
      }
    },
    [polsOnParade, searchPolsByLocation]
  );

  // Track if location has been fetched to prevent duplicate API calls
  const hasFetchedLocation = useRef(false);

  // Location state for caching geocoded results
  const [location, setLocation] = useState<Location>(INIT.location);

  /**
   * Handles location-based search (DISTRICT mode)
   *
   * Validates input, checks cache, and calls geocoding API
   * Shows appropriate alerts for various error conditions
   */
  const handleSearchByLocation = useCallback(
    (e: UserEvent) => {
      // Only proceed on Enter key or click, and if not already fetched
      if (
        (e.type === 'keydown' &&
          (e as unknown as KeyboardEvent).key !== 'Enter') ||
        hasFetchedLocation.current
      ) {
        return;
      } else {
        // Use controlled input value instead of DOM traversal for reliability across devices
        const addressInput = (showClearBtn || '').trim();

        // Return early if input is empty
        if (!addressInput) {
          return;
        }

        // Validate minimum address length
        if (addressInput.length < 5) {
          alert(SEARCH_COPY.SEARCH.DISTRICT.TOOSHORT);
          return;
        } else if (
          location.address !== '' &&
          location.address === addressInput
        ) {
          // Use cached location data
          incumbentHasNoChallenger(location.ocd_id);
        } else {
          // Fetch new location data
          hasFetchedLocation.current = true;
          setIsFinding(true);
          API.getPolsByLocation(addressInput)
            .then(({ data }) => {
              if (data === 'prompt-requery') {
                // Address is ambiguous - user needs to be more specific
                alert(SEARCH_COPY.SEARCH.DISTRICT.SPLIT);
              } else {
                // Cache the location data and search
                if (!hasFetchedLocation.current)
                  setLocation((loc: Location) => ({
                    ...loc,
                    ocd_id: data,
                    address: addressInput,
                  }));
                incumbentHasNoChallenger(data);
              }
            })
            .catch(() => alert(SEARCH_COPY.SEARCH.DISTRICT.NOTFOUND))
            .finally(() => {
              setIsFinding(false);
              hasFetchedLocation.current = false;
            });
        }
      }
    },
    [location, setIsFinding, incumbentHasNoChallenger, showClearBtn]
  );

  // Memoized check for non-location search options
  const searchOptionIsNotLocation = useMemo(
    () => searchOption.name !== 'DISTRICT',
    [searchOption]
  );

  // Dynamic placeholder text based on device and search mode; empty when a pol is selected (badge shown)
  const placeholder = useMemo(
    () =>
      candidateName
        ? ''
        : isDesktop
          ? !searchOptionIsNotLocation
            ? SEARCH_COPY.SEARCH.DISTRICT.PLACEHOLDERS
            : ''
          : searchOption.label,
    [candidateName, isDesktop, searchOptionIsNotLocation, searchOption]
  );

  /**
   * Scrolls the selected candidate into view in the carousel
   *
   * Finds the index of the selected candidate in the applied list and
   * scrolls the carousel to that position. Works with react-window
   * virtualization by calculating scroll position based on index.
   */
  const scrollToSelectedCandidate = useCallback(
    (e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) {
        if (e.type === 'keydown') {
          e.preventDefault();
        }
        e.stopPropagation();
      }
      if (!selectedPol || !polsOnParade?.applied) return;

      const candidateIndex = (polsOnParade.applied as HouseMember[]).findIndex(
        (pol: HouseMember) => pol.id === selectedPol
      );

      if (candidateIndex === -1) {
        logWarn(`Candidate with ID ${selectedPol} not found in applied list`);
        return;
      }

      const badgeEl =
        e?.currentTarget &&
        typeof (e.currentTarget as HTMLElement).blur === 'function'
          ? (e.currentTarget as HTMLElement)
          : null;

      requestAnimationFrame(() => {
        const carousel = document.getElementById('pol-carousel');
        const scrollContainer = carousel?.querySelector('.list') as HTMLElement;

        if (scrollContainer) {
          const cardWidth = isDesktop ? 247 : 166;
          const containerWidth = scrollContainer.clientWidth;
          const scrollPosition =
            candidateIndex * cardWidth - containerWidth / 2 + cardWidth / 2;

          // Instant scroll so the next click on a carousel card is not during scroll (avoids two-clicks)
          scrollContainer.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: 'auto',
          });
        } else {
          const candidateCard = document.getElementById(selectedPol);
          if (candidateCard) {
            candidateCard.scrollIntoView({
              behavior: 'auto',
              block: 'nearest',
              inline: 'center',
            });
          }
        }
        if (badgeEl) badgeEl.blur();
      });
    },
    [selectedPol, polsOnParade, isDesktop]
  );

  const polSearchClass = useMemo(
    () =>
      `pol-search ${!searchOptionIsNotLocation ? 'district-option' : ''} ${candidateName ? 'pol-search-with-badge' : ''}`,
    [searchOptionIsNotLocation, candidateName]
  );

  return (
    <div className={'dropdown-combobox'}>
      <InputGroup>
        {/* Desktop-only label */}
        {isDesktop && (
          <Form.Label
            className={'pol-search-label'}
            {...getLabelProps()}
          >
            {searchOption.label}
          </Form.Label>
        )}

        {/* Search icon */}
        <InputGroup.Text>
          <i
            className={'bi bi-search'}
            aria-hidden
          />
        </InputGroup.Text>

        {/* Main search input with badge inside */}
        <div className={'pol-search-wrapper'}>
          <Form.Control
            {...getInputProps()}
            aria-label={'politician search bar'}
            aria-autocomplete={'none'}
            className={polSearchClass}
            placeholder={placeholder}
            value={showClearBtn}
            type={'search'}
          />
          {/* Custom clear button when no badge and input has value */}
          {!candidateName && showClearBtn && (
            <button
              onClick={() => {
                setShowClearBtn('');
                (restorePolsOnParade as () => void)();
              }}
              onKeyDown={(e) =>
                handleKeyDown(e, () => {
                  setShowClearBtn('');
                  (restorePolsOnParade as () => void)();
                })
              }
              className={'pol-search-clear-btn'}
              aria-label={'Clear search'}
              type={'button'}
              tabIndex={0}
            >
              ×
            </button>
          )}
          {/* Selected candidate badge inside input */}
          {candidateName && (
            <div className='selected-candidate-badge-inside'>
              <Badge
                aria-label={`Scroll to ${candidateName} in carousel`}
                style={{ cursor: 'pointer', position: 'relative' }}
                onKeyDown={(e) =>
                  handleKeyDown(e, scrollToSelectedCandidate, e)
                }
                onClick={scrollToSelectedCandidate}
                className={'selected-candidate-badge'}
                role={'button'}
                text={'light'}
                tabIndex={0}
                bg={'dark'}
              >
                <span className='selected-candidate-name'>{candidateName}</span>
                {polData?.district && polData?.state && (
                  <span className='selected-candidate-district'>
                    &nbsp;
                    {polData.district !== 'At-Large' ? 'District ' : ''}
                    {polData.district} of {polData.state}
                  </span>
                )}
                {/* Close button on badge */}
                <button
                  type='button'
                  className='badge-close-btn'
                  onClick={handleCloseSelectedPolBadge}
                  onKeyDown={(e) =>
                    handleKeyDown(e, handleCloseSelectedPolBadge)
                  }
                  aria-label='Clear selection'
                  tabIndex={0}
                >
                  x
                </button>
              </Badge>
            </div>
          )}
        </div>

        {/* Location search button or loading spinner */}
        {isFinding ? (
          <>
            <InputGroup.Text className='find-location--btn'>
              <Spinner
                role={'status'}
                animation={'border'}
                className={'pol-combobox-spinner'}
              >
                <span className='visually-hidden'>Finding local rep(s)...</span>
              </Spinner>
            </InputGroup.Text>
          </>
        ) : (
          <InputGroup.Text
            hidden={searchOptionIsNotLocation}
            onKeyDown={handleSearchByLocation}
            className={'find-location--btn'}
            onClick={handleSearchByLocation}
            aria-label={'submit location'}
            tabIndex={0}
          >
            Find
          </InputGroup.Text>
        )}
      </InputGroup>

      {/* Dropdown menu with search results */}
      <ul {...getMenuProps()}>
        {isOpen &&
          items &&
          showClearBtn !== '' &&
          items.map((item: ComboboxItem, index: number) => (
            <li
              style={
                highlightedIndex !== index
                  ? index % 2 === 0
                    ? SEARCH_COPY.SEARCH.DROPDOWN.ODD
                    : SEARCH_COPY.SEARCH.DROPDOWN.EVEN
                  : SEARCH_COPY.SEARCH.DROPDOWN.SELECTED
              }
              key={`${item}${index}`}
              {...getItemProps({ item, index })}
            >
              {itemToString(item)}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default React.memo(PolCombobox);
