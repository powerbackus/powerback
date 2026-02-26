import { Celebration } from '@Types';

export interface Celebrations {
  filteredEvents: Celebration[];
  sortedEvents: Celebration[];
  events: Celebration[];
  sortDirection: string;
  sortType: string;
}
