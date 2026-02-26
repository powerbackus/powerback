export interface ConfirmNewPasswordForm {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordErrorResponse {
  current?: string;
  new?: string;
}
