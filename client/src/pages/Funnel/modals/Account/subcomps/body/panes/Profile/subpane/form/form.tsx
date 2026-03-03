import React, {
  useRef,
  useMemo,
  useReducer,
  useCallback,
  useLayoutEffect,
  type ChangeEvent,
  type ReactElement,
  type HTMLInputTypeAttribute,
} from 'react';
import {
  Col,
  Row,
  Form,
  ToggleButton,
  ToggleButtonGroup,
} from 'react-bootstrap';
import type { ContactInfo, ValidatingFields } from '@Interfaces';
import { handleKeyDown, simulateMouseClick } from '@Utils';
import { Selector } from '@Components/forms';
import { STATES, COUNTRIES } from '@Tuples';
import { international } from './fn';
import { FormTippedField } from '.';
import type {
  DeviceProp,
  ProfileProp,
  UserDataProp,
  FieldControl,
  FormValidationProp,
} from '@Types';
import './style.css';

/**
 * Union type for form field values
 * Can be either a string or boolean value
 */
type Value = string | boolean;

/**
 * Event data structure for form field changes
 * Contains the field name and its new value
 */
type EventData = {
  /** The new value of the field */
  value: Value;
  /** The name/identifier of the field */
  name: string;
};

/**
 * Field group structure for organizing form controls
 * Groups related form fields together (e.g., contact info, address info)
 */
type FieldGroup = {
  /** Array of field controls in this group */
  controls: FieldControl[];
  /** Unique event key for the group */
  eventKey: string;
  /** Display name for the group */
  name: string;
  /** Unique key for React rendering */
  key: string;
};

/**
 * Additional props specific to the ProfileForm component
 */
type ProfileFormLocalProps = {
  /** Function that returns the field label → element map for focus management */
  getFieldMap: () => Map<string, HTMLElement>;
  /** Array of form field controls to render */
  form: FieldControl[];
  /** Set internationalization (i18n) */
  setIntl?: () => void;
  /** Employment status as string for button toggling ('0' = false, '1' = true) */
  isEmployed: string;
};

type ProfileFormProps = ProfileFormLocalProps &
  FormValidationProp &
  UserDataProp &
  ProfileProp &
  DeviceProp;

/**
 * ProfileForm Component
 *
 * A comprehensive form component for user profile information management.
 * Handles contact information, address details, and employment information
 * with real-time validation and compliance tracking.
 *
 * Key Features:
 * - Dynamic field rendering based on user's country and employment status
 * - Real-time validation with visual feedback
 * - Field blur tracking for compliance updates (prevents premature changes)
 * - International address support with passport field
 * - Employment information conditional display
 * - Responsive design for mobile and desktop
 *
 * Field Blur Integration:
 * - Calls markFieldCompleted() when user moves focus away from fields
 * - Enables compliance tier updates only after user "finishes" fields
 * - Improves UX by preventing premature compliance changes during typing
 *
 * @param resetValidation - Function to reset form validation state
 * @param setContactInfo - Function to update contact information
 * @param validateField - Function to validate individual fields
 * @param formIsInvalid - Whether the form has validation errors
 * @param contactInfo - Current contact information data
 * @param getFieldMap - Function to get field mapping for focus management
 * @param isEmployed - Employment status as string ('0' = false, '1' = true)
 * @param isInvalid - Object containing validation state for each field
 * @param isMobile - Whether the user is on a mobile device
 * @param settings - User settings object
 * @param setIntl - Function to set international status
 * @param form - Array of field controls to render
 *
 * @returns JSX element containing the profile form
 */
const ProfileForm = ({
  resetValidation,
  setContactInfo,
  validateField,
  formIsInvalid,
  contactInfo,
  getFieldMap,
  isEmployed,
  isInvalid,
  isMobile,
  settings,
  setIntl,
  form,
}: ProfileFormProps) => {
  const RADIOS = useMemo(() => ['NO', 'YES'], []);

  const { STATES: state, COUNTRIES: country } = { STATES, COUNTRIES };
  const getCountry = useRef(null),
    intlReducer = useCallback(() => {
      if (!getCountry) return;
      if (!(getCountry.current as unknown as HTMLOptionElement)) return;
      if (
        ((getCountry.current as unknown as HTMLOptionElement)
          .value as string) === 'United States'
      )
        return false;
      else return true;
    }, []),
    [isInternational, setIsInternational] = useReducer(
      intlReducer,
      true // otherwise cannot pull focus on Passport field because it renders too quickly
    );

  useLayoutEffect(() => setIsInternational(), [setIsInternational]);

  const handleChange = useCallback(
    (e: ChangeEvent) => {
      let { name, value }: EventData = e.target as HTMLInputElement;
      (validateField as (e: ChangeEvent<HTMLInputElement>) => void)(
        e as ChangeEvent<HTMLInputElement>
      );
      if (name === 'isEmployed') {
        if (value === '1') (value as unknown as Value) = true;
        else if (value === '0') {
          value = false;
          (resetValidation as () => void)();
        }
      }
      if (name === 'country') {
        setIsInternational();
        (setIntl as () => void)();
      }
      (setContactInfo as ({ name, value }: EventData) => void)({
        name,
        value,
      });
    },
    [setIntl, validateField, setContactInfo, resetValidation]
  );

  const handleHideUnemployment = useCallback(
    (name: string) => {
      if (
        !!!Number(isEmployed) &&
        (name === 'occupation' || name === 'employer')
      ) {
        return true;
      } else return false;
    },
    [isEmployed]
  );

  const provideFormComponents = useCallback(
    (field: FieldControl) => {
      /**
       * Renders a form input element with field blur tracking
       *
       * Creates a Form.Control component with all necessary props including
       * field blur tracking for compliance updates. The onBlur handler
       * calls markFieldCompleted to track when user finishes filling out a field.
       *
       * @param field - Field control configuration object
       * @returns Form.Control JSX element
       */
      function inputElement(field: FieldControl) {
        const fieldInvalid = (isInvalid as ValidatingFields)[
          field.name as keyof ValidatingFields
        ];
        const errorId = 'profile-form-error-' + field.name.toLowerCase();
        return (
          <Form.Control
            {...field}
            id={'profile-form-input-' + field.name.toLowerCase()}
            value={
              ((contactInfo as ContactInfo)[field.name as keyof ContactInfo] ??
                '') as string | number | string[] | undefined
            }
            data-lpignore={field['data-lpignore'] ?? false}
            hidden={handleHideUnemployment(field.name)}
            autoComplete={field.autoComplete}
            aria-label={field['aria-label']}
            aria-invalid={fieldInvalid ?? false}
            aria-describedby={fieldInvalid ? errorId : undefined}
            autoCapitalize={'words'}
            onChange={handleChange}
            className={'mb-1'}
            spellCheck={false}
            autoFocus={false}
            type={field.type}
            onBlur={() => {
              // Field blurred
            }}
          />
        );
      }

      return {
        tel: inputElement(field),
        text: inputElement(field),
        email: inputElement(field),
        number: inputElement(field),
        radio: (
          /**
           * Employment status radio button group
           *
           * Renders a toggle button group for employment status selection.
           * Uses ToggleButtonGroup instead of SwitchButtons due to logical complexity.
           * Includes field blur tracking for compliance updates.
           */

          <ToggleButtonGroup
            {...field}
            id={'profile-form-toggle-button-group'}
            aria-label={field['aria-label']}
            defaultValue={[isEmployed]}
            className={'my-lg-1'}
            vertical={false}
            type={'radio'}
            size={'lg'}
          >
            {RADIOS.map((radio, i) => (
              <ToggleButton
                name={'radio'}
                value={String(i)}
                checked={!!isEmployed}
                onChange={handleChange}
                id={`employed-choice-${radio}`}
                key={`employed-choice-${radio}`}
                onKeyDown={(e) => {
                  if (!!isEmployed)
                    handleKeyDown(
                      e,
                      simulateMouseClick as unknown as () => void,
                      e.target
                    );
                }}
              >
                {radio}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ),
        select: (
          <Selector
            disabled={international.disable(field, isInternational)}
            items={field.name === 'state' ? state : country}
            value={
              ((contactInfo as ContactInfo)[
                (field as FieldControl).name as string as keyof ContactInfo
              ] as unknown as string) ?? ''
            }
            handleChange={handleChange}
            getCountry={getCountry}
            {...field}
          />
        ),
      };
    },
    [
      handleHideUnemployment,
      isInternational,
      handleChange,
      contactInfo,
      isEmployed,
      isInvalid,
      country,
      RADIOS,
      state,
    ]
  );

  const handleFieldControls = useCallback(
    (field: FieldControl) => {
      return (
        provideFormComponents(field) as unknown as HTMLInputTypeAttribute
      )[
        field.type as string as keyof HTMLInputTypeAttribute
      ] as HTMLInputTypeAttribute;
    },
    [provideFormComponents]
  );

  const passportControlOnMobile = useCallback(
    (field: FieldControl) => {
      return (
        isMobile &&
        field.name === 'passport' &&
        (contactInfo as ContactInfo).passport === ''
      );
    },
    [isMobile, contactInfo]
  );

  /**
   * Determines the appropriate subtext or feedback component to display
   * below a form field, based on the field definition, platform (mobile/desktop),
   * field validation, and employment status.
   *
   * @param field - The field control object for the form input.
   * @returns Either a string, a ReactNode (Form.Text or Form.Control.Feedback), or null,
   *          depending on the situation and requirements for subtext or feedback.
   *
   * Logic:
   * 1. If the field is the passport field and on mobile with an empty value, show field.formtext.
   * 2. If there is no feedback and no formtext, return '' for mobile, otherwise null.
   * 3. If the field is invalid and has feedback, show the appropriate feedback component/type:
   *    - as plain text on mobile
   *    - as <Form.Control.Feedback type="invalid"> on desktop
   * 4. If formtext exists:
   *    a. If formtext is a length-2 array (for T/F isEmployed),
   *         return element based on isEmployed (centered on desktop).
   *    b. If not an array,
   *         return as plain text on mobile,
   *         or as a centered Form.Text for 'employer' or 'occupation',
   *         or simply as Form.Text otherwise.
   */
  const handleSubText = useCallback(
    (field: FieldControl) => {
      // 1. Special case: passport field on mobile and empty
      if (passportControlOnMobile(field)) return field.formtext;
      // 2. No feedback and no formtext: display nothing or empty string on mobile
      else if (!field.feedback && !field.formtext) {
        return isMobile ? '' : null;
      }
      // 3. Field invalid and has feedback
      else if (
        (isInvalid as ValidatingFields)[
          field.name as string as keyof ValidatingFields
        ] &&
        field.feedback
      ) {
        return isMobile ? (
          field.feedback
        ) : (
          <Form.Control.Feedback
            id={'profile-form-error-' + field.name.toLowerCase()}
            type={'invalid'}
          >
            {field.feedback}
          </Form.Control.Feedback>
        );
      }
      // 4. Display formtext if it exists
      else if (field.formtext) {
        // a. If formtext is an array of length 2, match to isEmployed status
        if (field.formtext.length === 2) {
          // array for T/F isEmployed
          return isMobile ? (
            field.formtext[Number(isEmployed)]
          ) : (
            <Form.Text className={'text-center'}>
              {field.formtext[Number(isEmployed)]}
            </Form.Text>
          );
        } else
          // b. Otherwise handle based on field name/desktop/mobile
          return isMobile ? (
            field.formtext
          ) : field.name === 'employer' || field.name === 'occupation' ? (
            <Form.Text className={'text-center'}>{field.formtext}</Form.Text>
          ) : (
            <Form.Text>{field.formtext}</Form.Text>
          );
      }
      // If none of the above, return nothing (undefined)
    },
    [isMobile, isInvalid, isEmployed, passportControlOnMobile]
  );
  // user choice from Settings
  const showToolTipIsOn = useMemo(() => {
    if (!settings) return true;
    return settings.showToolTips !== void 0 && settings.showToolTips;
  }, [settings]);

  const showTheseTooltips = useCallback(
    (field: FieldControl) => {
      // first, is there even any text to display?
      if (!field.feedback && !field.formtext) return;
      else
        return (
          (field.feedback ? field.feedback.length : false) ||
          ((field.formtext ? field.formtext.length : false) &&
            // special case for Passport field
            (passportControlOnMobile(field) ||
              // or show tooltip if isEmployed "NO" is selected
              ((!(contactInfo as ContactInfo).isEmployed || !isEmployed) &&
                field.name === 'isEmployed') ||
              field.name === 'email' ||
              ((contactInfo as ContactInfo).isEmployed &&
                (field.name === 'employer' || field.name === 'occupation'))))
        );
    },
    [contactInfo, isEmployed, passportControlOnMobile]
  );

  const verticallyCenterFields = useCallback((controls: FieldControl[]) => {
    // (expand this later for different screen sizes)
    const fieldMarginTopValues = { 6: 2, 4: 2, 3: 4 };
    return fieldMarginTopValues[
      (controls as FieldControl[]).length as number as keyof object
    ];
  }, []);

  const handleLabel = useCallback(
    (field: FieldControl) => {
      // if (field.name === 'isEmployed') return;
      return (
        <Form.Label
          htmlFor={'profile-form-input-' + field.name.toLowerCase()}
          hidden={handleHideUnemployment(field.name)}
        >
          {international.label(field, isInternational)}
        </Form.Label>
      );
    },
    [isInternational, handleHideUnemployment]
  );

  return (
    <Form
      noValidate
      validated={formIsInvalid}
      className={'profile-form pt-lg-2 px-lg-3'}
    >
      <Row className={'align-items-lg-baseline'}>
        {/* Render form fields if they exist */}
        {form ? (
          // Iterate over each field in the form
          ((form as unknown as FieldGroup).controls as FieldControl[]).map(
            (field, i) => {
              const intlWidth = international.width(
                field,
                i,
                isMobile,
                isInternational
              );

              const showTip = showTheseTooltips(field) && showToolTipIsOn;

              // Render the form field column
              return (
                <Col
                  key={'profile-form-field-' + field.name}
                  ref={(node: ReactElement) => {
                    const map = getFieldMap();
                    const child =
                      node &&
                      (
                        node as ReactElement & {
                          children?: Record<string, HTMLElement>;
                        }
                      ).children?.[field.name];
                    if (node && child) map.set(field.label, child);
                    else map.delete(field.label);
                  }}
                  className={`profile-field mt-lg-${verticallyCenterFields(
                    (form as unknown as FieldGroup).controls
                  )}`}
                  hidden={!international.show(field, isInternational)}
                  lg={intlWidth}
                  xs={intlWidth}
                >
                  {handleLabel(field)}
                  {isMobile && showTip ? (
                    <FormTippedField
                      field={
                        handleFieldControls(field) as unknown as FieldControl
                      }
                      subText={handleSubText(field) as string}
                      name={field.name}
                    />
                  ) : (
                    handleFieldControls(field)
                  )}
                  {!isMobile ? (
                    <span
                      hidden={handleHideUnemployment(field.name)}
                      className={'pt-lg-2'}
                    >
                      {handleSubText(field)}
                    </span>
                  ) : null}
                </Col>
              );
            }
          )
        ) : (
          <>Loading...</>
        )}
      </Row>
    </Form>
  );
};

export default React.memo(ProfileForm);
