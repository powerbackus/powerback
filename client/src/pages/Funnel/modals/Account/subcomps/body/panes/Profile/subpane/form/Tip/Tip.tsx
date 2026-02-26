import React, { ReactElement } from 'react';
import { Tooltip, OverlayTrigger } from 'react-bootstrap';
import type { FieldControl } from '@Types';

type FormTippedFieldProps = {
  field: FieldControl;
  subText: string;
  name: string;
};

const FormTippedField = ({ subText, field, name }: FormTippedFieldProps) => (
  <OverlayTrigger
    overlay={<Tooltip id={name + '-profile-form-tooltip'}>{subText}</Tooltip>}
    placement={'bottom'}
    trigger={'focus'}
    delay={0}
  >
    {field as unknown as ReactElement}
  </OverlayTrigger>
);

export default React.memo(FormTippedField);
