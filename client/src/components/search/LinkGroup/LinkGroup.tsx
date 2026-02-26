/**
 * Search link group. Parade links, search option toggles.
 * @module LinkGroup
 */
import React, {
  useRef,
  useCallback,
  useLayoutEffect,
  MouseEventHandler,
  KeyboardEventHandler,
} from 'react';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { SEARCH_COPY } from '@CONSTANTS';
import { useParade } from '@Hooks';
import {
  useSearch,
  useDialogue,
  useDonationState,
  type LinksClass,
  type SearchOption,
} from '@Contexts';

const SearchLinkGroup = () => {
  const {
    linksClass,
    searchOption,
    showClearBtn,
    setLinksClass,
    setSearchOption,
    setShowClearBtn,
  } = useSearch();

  const { showAlert, setShowAlert } = useDialogue(),
    [, { restorePolsOnParade }] = useParade(),
    { selectedPol, polData } = useDonationState();

  const hasSelectedPol = Boolean(selectedPol && polData?.id);

  const prevSearchOptionRef = useRef(searchOption);

  useLayoutEffect(() => {
    if (
      searchOption &&
      prevSearchOptionRef.current?.name !== searchOption.name
    ) {
      prevSearchOptionRef.current = searchOption;
      if (showAlert.login) {
        setShowAlert((a) => ({ ...a, login: false }));
      }
    }
  }, [searchOption, showAlert.login, setShowAlert]);

  const handleOptions = useCallback(
    (e: KeyboardEvent & MouseEvent) => {
      if (
        searchOption?.name ===
        ((e.target as HTMLSpanElement).textContent as string).toUpperCase()
      )
        return;
      else {
        setSearchOption?.(
          SEARCH_COPY.SEARCH.LINKS.pols.filter((link) => {
            return (
              link.value ===
              ((e.target as HTMLSpanElement).textContent as string)
            );
          })[0] as SearchOption
        );
        setLinksClass?.({
          ...{ NAME: '', STATE: '', DISTRICT: '' },
          [((e.target as HTMLSpanElement).textContent as string).toUpperCase()]:
            'options-link-active',
        });
        // Restore full carousel when switching search options
        // Use requestAnimationFrame to ensure this happens after the search option update
        requestAnimationFrame(() => {
          restorePolsOnParade?.();
        });
        if (!showClearBtn) return;
        else if (showClearBtn.length > 0) setShowClearBtn?.('');
      }
    },
    [
      searchOption,
      showClearBtn,
      setLinksClass,
      setSearchOption,
      setShowClearBtn,
      restorePolsOnParade,
    ]
  );

  return (
    <ListGroup
      horizontal={true}
      className={hasSelectedPol ? 'search-has-selection' : undefined}
    >
      {(SEARCH_COPY.SEARCH.LINKS.pols as SearchOption[]).map(
        (link: SearchOption) => (
          <ListGroupItem
            onKeyDown={handleOptions as unknown as KeyboardEventHandler}
            onClick={handleOptions as unknown as MouseEventHandler}
            className={(linksClass as LinksClass)[link.name]}
            key={link.name}
            action
          >
            {link.value}
          </ListGroupItem>
        )
      )}
    </ListGroup>
  );
};

export default React.memo(SearchLinkGroup);
