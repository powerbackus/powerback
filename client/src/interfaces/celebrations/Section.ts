import { Messages } from './Messages';

export interface CelebrationSection {
  handleBrowserPush: (MESSAGES: Messages) => void;
  suggestedDonations: number[];
  modalMessage: string;
}
