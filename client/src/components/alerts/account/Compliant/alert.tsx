import React from 'react';
import type { AlertProps } from '@Components/alerts/props';
import { useComplianceTier } from '@Contexts';
import StyledAlert from '../../StyledAlert';
import { ACCOUNT_COPY } from '@CONSTANTS';
import accounting from 'accounting';
import './style.css';

/**
 * AlertCompliant component that displays a success message when a user's profile
 * becomes compliant with FEC regulations.
 *
 * This component shows a congratulatory message to users who have successfully
 * completed their profile information and achieved Compliant tier compliance. It
 * displays the new donation limits they can now access.
 *
 * @component
 * @param {AlertProps} props - Component props
 * @param {boolean} props.show - Whether the alert should be displayed
 * @param {Function} [props.setShow] - Function to control alert visibility (default: empty function)
 * @param {number} [props.timeout] - Time in milliseconds before auto-dismiss (default: 7000)
 *
 * @example
 * ```typescript
 * <AlertCompliant
 *   show={showCompliantAlert}
 *   setShow={setShowCompliantAlert}
 *   timeout={7000}
 * />
 * ```
 *
 * @returns {JSX.Element} Success alert component with compliance information
 */
const AlertCompliant = ({
  show,
  setShow = () => {},
  timeout = 7000,
}: AlertProps) => {
  // Get compliance info for compliant tier
  const { complianceInfo: compliantInfo } = useComplianceTier();

  return (
    <StyledAlert
      show={show}
      time={timeout}
      type={'update'}
      setShow={setShow}
      dismissible={true}
      icon={'person-check'}
      iconClass={'text-light'}
      alertClass={'updated-ok-alert'}
      heading={<>&nbsp;You're all set!</>}
      message={`${
        ACCOUNT_COPY.APP.PROMOTION_ALERT_COPY
      }${accounting.formatMoney(compliantInfo.perElectionLimit || 0, '$', 0)} ${ACCOUNT_COPY.APP.COMPLIANCE_CTA[1].toLowerCase()}`}
    />
  );
};
export default React.memo(AlertCompliant);
