import React, { useCallback, useMemo } from 'react';
import type { Celebrations } from '@Interfaces';
import type { UserDataProp } from '@Types';
import type { UserData } from '@Contexts';
import numtoWords from 'number-to-words';
import './style.css';

type ExploreProps = UserDataProp & {
  filterActive: () => boolean | undefined;
  events: Celebrations;
  user: UserData;
};

const Explore = ({ user, events, filterActive }: ExploreProps) => {
  const EventCount = useMemo(
      () => events.filteredEvents.length,
      [events.filteredEvents.length]
    ),
    wordsOrNumber = useCallback(() => {
      if (EventCount > 99) return EventCount;
      else if (EventCount > 1) return numtoWords.toWords(EventCount);
      else return 'first';
    }, [EventCount]);

  return (
    <div className={'pt-3 pb-1 py-lg-0 mx-4'}>
      {EventCount > 0 ? (
        <span className={'text-center explore mb-2'}>
          {user?.firstName ? user.firstName + ', e' : 'E'}
          xplore {filterActive() && EventCount > 1 ? 'these ' : 'your '}
          {wordsOrNumber()} Celebration
          {`${EventCount === 1 ? '!' : 's.'}`}
        </span>
      ) : (
        <span className={'text-center explore'}>
          No celebrations match your filters.
        </span>
      )}
    </div>
  );
};
export default React.memo(Explore);
