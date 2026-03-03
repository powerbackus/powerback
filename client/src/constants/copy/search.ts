/**
 * Copy registry for Search components
 */

export interface SearchLink {
  name: 'NAME' | 'STATE' | 'DISTRICT';
  value: 'Name' | 'State' | 'District';
  label: 'Searching by Name' | 'Searching by State' | 'Search by Address';
}

interface SearchCopy {
  SEARCH: {
    SET: string;
    LINKS: {
      pols: Array<SearchLink>;
    };
    DISTRICT: {
      NOTFOUND: string;
      TOOSHORT: string;
      SPLIT: string;
      NO_CHALLENGER: [string, string, string];
      PLACEHOLDERS: string;
    };
    DROPDOWN: {
      ODD: { color: string; backgroundColor: string };
      EVEN: { color: string; backgroundColor: string };
      SELECTED: { color: string; backgroundColor: string };
    };
  };
}

export const SEARCH_COPY: SearchCopy = {
  SEARCH: {
    SET: 'HOUSE MEMBERS',
    LINKS: {
      pols: [
        {
          name: 'NAME',
          value: 'Name',
          label: 'Searching by Name',
        },
        {
          name: 'STATE',
          value: 'State',
          label: 'Searching by State',
        },
        {
          name: 'DISTRICT',
          value: 'District',
          label: 'Search by Address',
        },
      ],
    },
    DISTRICT: {
      NOTFOUND:
        'District not found. Please try again with a full address including the zip code.',
      TOOSHORT:
        'District not found. Please try again with a complete 5-digit ZIP code in your query.',
      SPLIT:
        'Your area may be split across multiple districts. Please try again with a more complete address, and/or a different ZIP code.',
      NO_CHALLENGER: [
        'The incumbent for District',
        'of',
        "has no serious, financed challenger. (In other words, they don't need anyone's money!) See the FAQ for more information about why we don't include such candidates.",
      ],
      PLACEHOLDERS: 'Type address+/ZIP code, then click "Find" or press ENTER.',
    },
    DROPDOWN: {
      ODD: { color: 'var(--text)', backgroundColor: 'var(--odd)' },
      EVEN: { color: 'var(--text)', backgroundColor: 'var(--even)' },
      SELECTED: {
        color: 'var(--input)',
        backgroundColor: 'var(--selected)',
      },
    },
  },
};

export default SEARCH_COPY;
