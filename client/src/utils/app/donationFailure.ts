/**
 * Props describing a failed donation attempt.
 * Used to derive user-facing messaging and alert variant.
 */
export interface DonationFailureProps {
  donation?: number;
  understands?: boolean;
  complies?: boolean;
}

/**
 * Builds a user-facing failure message and alert variant for a blocked donation.
 *
 * - When `understands` is false, prepends an eligibility warning.
 * - When `complies` is false, upgrades the variant to 'danger' and includes the
 *   attempted donation amount in the copy.
 *
 * This function does **not** perform any compliance logic itself; it only formats
 * feedback based on the backend response flags.
 */
export const donationFailure = ({
  donation,
  understands,
  complies,
}: DonationFailureProps) => {
  let variant = 'warning',
    message = 'You have not been charged anything.';
  if (!understands) {
    message =
      'You must understand and abide by the Eligibility rules before donating. \n' +
      message;
  }
  if (!complies) {
    variant = 'danger';
    message =
      'Donation ($' +
      donation +
      ') exceeds legal limit and cannot be processed. \n ' +
      message;
  }
  message.replace('  ', ' ');
  if (message[message.length - 1] === ' ')
    message = message.substring(0, message.length - 1);
  return { variant: variant, message: message };
};
