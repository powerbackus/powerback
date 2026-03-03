import React from 'react';
import { SubmitButtonProps } from '@Components/buttons/Submit/Submit';
import { AlertUserEntryError } from '@Components/alerts';
import { SubmitBtn } from '@Components/buttons';
import type { View } from '@Hooks';

type BtnErrorSwapperProps = {
  btnProps: SubmitButtonProps;
  showError: boolean;
  view: View;
};

const ButtonErrorSwapper = ({
  showError,
  btnProps,
  view,
}: BtnErrorSwapperProps) => (
  <>
    <SubmitBtn
      {...btnProps}
      hidden={showError}
      size={btnProps.size ?? 'lg'}
      value={btnProps.value ?? 'Continue'}
      btnId={btnProps.btnId ?? 'userform-submitbtn'}
    />
    <AlertUserEntryError hidden={!showError} {...view} />
  </>
);

export default React.memo(ButtonErrorSwapper);
