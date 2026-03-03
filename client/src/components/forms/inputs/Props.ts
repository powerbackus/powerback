import type { ChangeEvent } from 'react';

export interface Props {
  onChange: (e: ChangeEvent) => void;
  label: string | undefined;
  value: string | undefined;
  hideFeedback?: boolean;
  isGenerating?: boolean;
  autoComplete: string;
  controlName?: string;
  placeholder?: string;
  controlId?: string;
  feedback?: string;
  pattern?: string;
  cls?: string;
}
