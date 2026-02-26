import React, {
  useRef,
  useMemo,
  useState,
  useCallback,
  type Dispatch,
  type FormEvent,
  type MouseEvent,
  type ChangeEvent,
  type KeyboardEvent,
  type SetStateAction,
} from 'react';
import {
  useEntryForm,
  useButtonErrorSwapper,
  type UserEntryForm,
} from '@Hooks';
import {
  Col,
  Row,
  Form,
  Button,
  FormCheck,
  FormGroup,
  Placeholder,
} from 'react-bootstrap';
import {
  useAuth,
  useDialogue,
  useNavigation,
  useDonationState,
  type UserEntryResponse,
} from '@Contexts';
import { UsernameField, PasswordField } from '@Components/forms';
import { BtnErrorSwapper } from '@Components/displays';
import { handleOverlay, handleFeedback } from './fn';
import { PopoverTarget } from '@Components/buttons';
import { AxiosError, HttpStatusCode } from 'axios';
import { INIT, ACCOUNT_COPY } from '@CONSTANTS';
import { handleKeyDown } from '@Utils';
import API from '@API';
import {
  type FormValidationProp,
  type NavigationProp,
  type AuthProp,
} from '@Types';
import './style.css';

/**
 * Logio Component
 *
 * Handles user authentication flow including login, registration, and form validation.
 * Manages credential switching between "Sign In" and "Join Now" modes with proper
 * state synchronization across the application.
 *
 * Key responsibilities:
 * - Form validation and error handling with visual feedback
 * - Authentication state management (login/register)
 * - Terms acceptance for new user registration
 * - Password reset overlay integration
 * - Button state swapping for loading/error states
 *
 * @param {Dispatch<SetStateAction<HTMLSpanElement | null>>} setForgotPwOverlayTarget - Callback to set password reset overlay target
 * @param {boolean} isPendingValidation - Whether form validation is in progress
 * @param {Route<typeof routes>} route - Current route for conditional rendering
 */
type LogioProps = AuthProp &
  FormValidationProp &
  NavigationProp & {
    setForgotPwOverlayTarget?: Dispatch<SetStateAction<HTMLSpanElement | null>>;
  };

const Logio = ({
  setForgotPwOverlayTarget,
  isPendingValidation,
  route,
}: LogioProps) => {
  /* Contexts - Centralized state management */
  const { credentialsPath, setCredentialsPath } = useDonationState(), // Current auth path (Sign In/Join Now)
    { isLoggingIn, authIn } = useAuth(), // Authentication state and login function
    { splash, navigateToSplashView } = useNavigation(),
    { showModal, showOverlay, setShowModal, setShowAlert, setShowOverlay } =
      useDialogue(); // Modal and overlay management

  // Form state management with validation
  const [
    { userEntryForm, userFormValidated },
    { setUserFormValidated, clearUserEntryForm, setUserEntryForm },
  ] = useEntryForm();

  /**
   * Button error swapper for handling loading/error states
   * Provides visual feedback during authentication attempts
   * Auto-reset is handled internally by the hook
   */
  const [buttonErrorSwapper, { swapToError, swapToButton }] =
    useButtonErrorSwapper();

  /**
   * Determine if we're in registration mode
   * Checks both splash state and credentials path for "Join Now" mode
   */
  const isJoinNow = useMemo(() => {
    return (
      (splash === 'Join Now' && !showModal.credentials) ||
      credentialsPath === 'Join Now'
    );
  }, [splash, showModal, credentialsPath]);

  /**
   * Dynamic submit button rendering
   * Shows loading placeholder during authentication or error/button states
   */
  const handleSubmitBtnFace = useMemo(() => {
    return (
      (isLoggingIn && !buttonErrorSwapper.showError && (
        <Placeholder
          as={Button}
          animation={'wave'}
          className={'continue-btn-placeholder btn-lg'}
        >
          <i className={'bi bi-hourglass-split fs-5'} />
        </Placeholder>
      )) || (
        <BtnErrorSwapper
          btnProps={{
            btnId: 'logio-submitbtn-' + credentialsPath,
            value: showModal.credentials
              ? credentialsPath
              : splash === 'Tour' || splash === ''
                ? credentialsPath
                : splash || '',
          }}
          {...buttonErrorSwapper}
        />
      )
    );
  }, [
    credentialsPath,
    buttonErrorSwapper,
    isLoggingIn,
    splash,
    showModal.credentials,
  ]);

  // Guard to prevent multiple terms modal triggers
  const guard = useRef(false);

  /**
   * Terms acceptance state for new user registration
   * Required checkbox for legal compliance
   */
  const [checkedTerms, setCheckedTerms] = useState(false);

  /**
   * Force show terms modal or toggle checkbox
   * Handles both click and keyboard events for accessibility
   */
  const forceShowTerms = useCallback(
    (e: ChangeEvent | MouseEvent | KeyboardEvent) => {
      guard.current = true;
      if (showModal.terms) {
        return;
      }
      if (e.type !== 'change') {
        if (checkedTerms) {
          return;
        }
        setShowModal((s) => ({
          ...s,
          terms: true,
        }));
      } else {
        setCheckedTerms((prev) => !prev);
      }
    },
    [showModal.terms, checkedTerms, setShowModal, setCheckedTerms]
  );

  /**
   * Switch between Sign In and Join Now modes
   * Resets form state and toggles between authentication paths
   */
  const handleSwapSubmitStatusForm = useCallback(() => {
    clearUserEntryForm();
    setCheckedTerms(false);
    setUserFormValidated(false);

    // Allow swap when in credentials modal, on Tour, or on splash page with Join Now/Sign In views
    const canSwap =
      showModal.credentials ||
      splash === 'Tour' ||
      splash === 'Join Now' ||
      splash === 'Sign In';

    if (!canSwap) {
      return;
    }

    if (showModal.credentials || splash === 'Tour') {
      if (credentialsPath === 'Join Now') setCredentialsPath('Sign In');
      else if (credentialsPath === 'Sign In') setCredentialsPath('Join Now');
    } else {
      // On splash page with Join Now or Sign In views
      if (splash === 'Join Now') navigateToSplashView('Sign In');
      else if (splash === 'Sign In') navigateToSplashView('Join Now');
    }
  }, [
    splash,
    navigateToSplashView,
    showModal,
    credentialsPath,
    clearUserEntryForm,
    setCredentialsPath,
    setUserFormValidated,
  ]);

  /**
   * Handle password reset overlay
   * Closes credentials modal and shows password reset interface
   */
  const overlayWrapper = useCallback(
    (e: KeyboardEvent<HTMLSpanElement> | MouseEvent<HTMLSpanElement>) => {
      handleOverlay(e, setForgotPwOverlayTarget, setShowOverlay);
      setShowModal((m) => ({
        ...m,
        credentials: false,
      }));
    },
    [setForgotPwOverlayTarget, setShowOverlay, setShowModal]
  );

  /**
   * User registration flow
   * Creates new user account and shows success alert
   */
  const joinUp = useCallback(
    async (form: UserEntryResponse) => {
      try {
        await API.createUser({ ...form });
        setUserFormValidated(false);
        setShowAlert((a) => ({ ...a, join: true }));
        setUserEntryForm(INIT.credentials);
        setShowModal((m) => ({ ...m, credentials: false }));
      } catch (err) {
        const status = (err as AxiosError).response?.status ?? 500;
        swapToError(status);
      }
    },
    [
      setUserFormValidated,
      setUserEntryForm,
      setShowAlert,
      setShowModal,
      swapToError,
    ]
  );

  /**
   * User login flow
   * Authenticates user and navigates to appropriate next step
   */
  /**
   * User login flow
   * Authenticates user and handles form/modal cleanup
   * Post-login navigation and validation is handled by Funnel component
   */
  const login = useCallback(
    async (form: UserEntryForm) => {
      try {
        await authIn(form);

        // Clean up form and modal state
        setShowModal((s) => ({ ...s, credentials: false }));
        setCredentialsPath(''); // Clear credentials path to prevent modal from reopening
        setUserEntryForm(INIT.credentials); // Reset user entry form
        setShowAlert((s) => ({
          ...s,
          login: true,
          logout: false,
          activate: false,
          delete: false,
          err: false,
        }));
      } catch (err) {
        const status = (err as AxiosError).response?.status ?? 500;
        swapToError(status);
      }
    },
    [
      authIn,
      swapToError,
      setShowAlert,
      setShowModal,
      setUserEntryForm,
      setCredentialsPath,
    ]
  );

  /**
   * Form submission handler
   * Validates form and routes to appropriate auth flow (login/register)
   */
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isLoggingIn) {
        return;
      }

      setUserFormValidated(false);

      const form = e.currentTarget;
      const { username, password } = form;
      const formData: UserEntryResponse = {
        username: username.value,
        password: password.value,
        err: 0 as HttpStatusCode,
      };

      if (!form.checkValidity()) {
        setUserFormValidated(true);
      } else {
        if (splash === 'Join Now' || credentialsPath === 'Join Now')
          joinUp(formData);
        else login(formData);
      }
    },
    [login, joinUp, splash, isLoggingIn, credentialsPath, setUserFormValidated]
  );

  /**
   * Input change handler with optimized state updates
   * Batches state changes to reduce re-renders and clears error states
   */
  const handleInput = useCallback(
    (e: ChangeEvent) => {
      const { name, value } = e.target as HTMLInputElement;

      // Batch state updates to reduce re-renders
      setUserEntryForm((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Only update other states if they actually need to change
      setShowOverlay((s) => (s.resetPass ? { ...s, resetPass: false } : s));

      // Only swap button if there's an error showing
      if (buttonErrorSwapper.showError) {
        swapToButton();
      }

      // Only update alert if there's an error showing
      setShowAlert((s) => (s.err ? { ...s, err: false } : s));
    },
    [
      swapToButton,
      setShowAlert,
      setShowOverlay,
      setUserEntryForm,
      buttonErrorSwapper,
    ]
  );

  /**
   * Terms acceptance label component
   * Shows validation state and handles terms modal interaction
   */
  const TermsLabel = useMemo(
    () => (
      <Col
        xs={'auto'}
        lg={'auto'}
      >
        <span
          className={`no-link-label ${
            userFormValidated && !checkedTerms && 'invalidated'
          }`}
        >
          {checkedTerms
            ? ACCOUNT_COPY.APP.CREDENTIALS.AGREE[1]
            : ACCOUNT_COPY.APP.CREDENTIALS.FEEDBACK.t}
        </span>
        <FormCheck.Label htmlFor={'accept-terms'}>
          <span
            onClick={forceShowTerms}
            onKeyDown={(e) => handleKeyDown(e, forceShowTerms, e)}
            className={'terms-link natural-link'}
          >
            <u tabIndex={0}>{ACCOUNT_COPY.APP.CREDENTIALS.AGREE[2]}</u>
          </span>
        </FormCheck.Label>
      </Col>
    ),
    [checkedTerms, forceShowTerms, userFormValidated]
  );

  /**
   * Dynamic label handler for form fields
   * Returns appropriate labels based on current mode (join/sign in)
   */
  const handleControlLabel = useCallback(
    (control: 'usr' | 'pwd') =>
      ({
        // 0 is sign in, 1 is join up
        usr: ['username', 'email address'],
        pwd: ['password', 'new password'],
      })[control][+isJoinNow],
    [isJoinNow]
  );

  return (
    <Form
      noValidate
      id={'logio-form'}
      onSubmit={handleSubmit}
      className={'text-center'}
      validated={userFormValidated}
    >
      <Row className={'text-center'}>
        <Col
          lg={12}
          className={'credentials-fields'}
        >
          {/* USERNAME AND PASSWORD FIELDS */}
          <Row>
            <Col
              xs={12}
              className={'input--translucent'}
            >
              <UsernameField
                value={
                  !userEntryForm
                    ? INIT.credentials.username
                    : userEntryForm.username
                }
                feedback={handleFeedback(
                  { ...ACCOUNT_COPY.APP.CREDENTIALS.FEEDBACK.u },
                  isPendingValidation,
                  showOverlay,
                  isJoinNow
                )}
                label={handleControlLabel('usr')}
                hideFeedback={userFormValidated}
                autoComplete={'username'}
                onChange={handleInput}
              />
            </Col>
            <Col
              xs={12}
              className={'input--translucent'}
            >
              <PasswordField
                value={
                  !userEntryForm
                    ? INIT.credentials.password
                    : (userEntryForm as UserEntryForm).password
                }
                isGenerating={isJoinNow && !userFormValidated}
                feedback={handleFeedback(
                  { ...ACCOUNT_COPY.APP.CREDENTIALS.FEEDBACK.p },
                  isPendingValidation,
                  showOverlay,
                  isJoinNow
                )}
                autoComplete={'current-password'}
                label={handleControlLabel('pwd')}
                onChange={handleInput}
              />
            </Col>
          </Row>
        </Col>

        {/* TERMS AND CONDITIONS / FORGOT PASSWORD SECTION */}
        <Col className={'toc flex-row'}>
          {isJoinNow ? (
            // Terms acceptance checkbox for new users
            <FormGroup
              controlId={'accept-terms'}
              aria-label={'Terms acceptance checkbox'}
            >
              <Row className='justify-content-center align-content-lg-center align-items-center'>
                <Col
                  xs={1}
                  lg={'auto'}
                >
                  <Form.Check
                    onChange={forceShowTerms}
                    checked={checkedTerms}
                    required={isJoinNow}
                    id={'accept-terms'}
                    type={'checkbox'}
                  />
                </Col>
                {TermsLabel}
              </Row>
            </FormGroup>
          ) : (
            // Forgot password link for existing users - hidden on reset page
            route?.name !== 'reset' && (
              <PopoverTarget handleOverlay={overlayWrapper}>
                {ACCOUNT_COPY.APP.CREDENTIALS.FORGOT_PW}
              </PopoverTarget>
            )
          )}
        </Col>

        {/* SUBMIT BUTTON - Dynamic rendering based on state */}
        <Col
          xs={12}
          className={'cta-form-btn'}
        >
          {handleSubmitBtnFace}
          {/* SWITCH BETWEEN SIGN IN AND JOIN NOW MODES */}
          <u
            className={'natural-link inconsolata'}
            onKeyDown={(e) => handleKeyDown(e, handleSwapSubmitStatusForm)}
            onClick={handleSwapSubmitStatusForm}
            tabIndex={0}
          >
            {ACCOUNT_COPY.APP.CREDENTIALS.SWITCH[+isJoinNow]}
          </u>
        </Col>
      </Row>
    </Form>
  );
};

export default React.memo(Logio);
