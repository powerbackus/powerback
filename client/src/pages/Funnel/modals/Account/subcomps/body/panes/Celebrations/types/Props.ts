import type { RefObject } from 'react';
import type { UserData } from '@Contexts';
import type { HouseMember } from '@Interfaces';

type Payload = string | undefined;

export interface CelebrationEventsAction {
  payload?: Payload;
  type: string;
}

export interface CelebrationsProps {
  filterEvents?: (action: CelebrationEventsAction) => void;
  textInputRef?: RefObject<HTMLInputElement>;
  pols?: HouseMember[];
  isMobile?: boolean;
  user: UserData;
}
