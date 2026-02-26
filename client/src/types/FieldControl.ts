export interface FieldControl {
  formtext?: string | string[];
  'data-lpignore'?: string;
  autoComplete?: string;
  'aria-label': string;
  feedback?: string;
  required: boolean;
  pattern?: string;
  label: string;
  role?: string;
  type: string;
  name: string;
}
