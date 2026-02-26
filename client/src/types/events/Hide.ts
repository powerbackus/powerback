import {
  type MouseEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from 'react';

export type HideEvent =
  | SyntheticEvent<any, CloseEvent>
  | KeyboardEvent<HTMLElement>
  | MouseEvent<HTMLElement>;
