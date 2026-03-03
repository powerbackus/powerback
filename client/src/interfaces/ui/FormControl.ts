import { FieldControl } from '@Types';

export interface ControlCategory {
  controls: FieldControl[];
  eventKey: string;
  label: string;
  key: string;
}
