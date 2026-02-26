import React, {
  useRef,
  useMemo,
  useState,
  useReducer,
  useCallback,
  type FocusEvent,
} from 'react';
import {
  Col,
  Row,
  FormGroup,
  FormLabel,
  InputGroup,
  FormControl,
} from 'react-bootstrap';
import PasswordStrengthBar from 'react-password-strength-bar';
import { InputGroupBtn } from '@Components/buttons';
import { useProfile } from '@Contexts';
import type { Props } from '../Props';
import { ICONS } from './tuples';
import './style.css';

const PasswordField = ({
  controlId = 'validation-password',
  controlName = 'password',
  pattern = '^[\\s\\S].*$',
  isGenerating = false, // generating a new password, or using an existing one
  autoComplete,
  hideFeedback = false, // more control over showing field validation feedback messages
  placeholder = '',
  feedback = '',
  onChange,
  label,
  value,
}: Props) => {
  const [passwordField, setPasswordField] = useState(ICONS[1]),
    [iconToggle, setIconToggle] = useReducer((i) => {
      return !i;
    }, true);

  const prevIconToggleRef = useRef(iconToggle);
  if (prevIconToggleRef.current !== iconToggle) {
    prevIconToggleRef.current = iconToggle;
    setPasswordField(ICONS[Number(iconToggle)]);
  }

  const [passwordInputIsInFocus, setPasswordInputIsInFocus] = useState(false);

  const handleFocus = useCallback(
    (e: FocusEvent) => setPasswordInputIsInFocus(e.type === 'focus'),
    []
  );

  const { serverConstants } = useProfile();

  const minLength = useMemo(
    () => serverConstants?.APP?.MIN_PASSWORD_LENGTH || 8,
    [serverConstants]
  );

  const passwordLength = useMemo(() => value?.length || 0, [value]);

  const showPasswordStrengthBar = useMemo(
    () =>
      isGenerating && (passwordInputIsInFocus || (value && passwordLength > 0)),
    [value, isGenerating, passwordLength, passwordInputIsInFocus]
  );

  const shortWord = useMemo(
    () => passwordLength - minLength,
    [passwordLength, minLength]
  );

  return (
    <Row>
      <Col
        xs={12}
        className={'userpass--field'}
      >
        <FormLabel htmlFor={controlId}>{label}</FormLabel>
        <FormGroup
          controlId={controlId}
          className={'form-input-wfeedback align-items-center'}
        >
          <InputGroup
            hasValidation
            className={'form-group'}
          >
            <InputGroupBtn
              title={(iconToggle ? '' : 'opened') + ' lock icon'}
              ico={passwordField.iconL + '-fill'}
              cls={'input-icon l'}
              tab={1}
            />
            <FormControl
              autoComplete={autoComplete}
              placeholder={placeholder}
              type={passwordField.type}
              onFocus={handleFocus}
              onBlur={handleFocus}
              onChange={onChange}
              name={controlName}
              pattern={pattern}
              value={value}
              required
            />
            <InputGroupBtn
              cb={setIconToggle}
              ico={passwordField.iconR}
              cls={'input-icon r password-field-icon r'}
              title={
                iconToggle
                  ? 'open eye icon on reveal password text'
                  : 'cancelled-out eye icon on hide password text'
              }
            />
            <FormControl.Feedback
              hidden={hideFeedback || passwordInputIsInFocus}
              type={'invalid'}
            >
              {feedback}
            </FormControl.Feedback>
          </InputGroup>
          {showPasswordStrengthBar && (
            <PasswordStrengthBar
              scoreWordClassName={'form-text'}
              className={'pw-strength-bar'}
              shortScoreWord={shortWord}
              minLength={minLength}
              scoreWords={['']}
              password={value}
            />
          )}
        </FormGroup>
      </Col>
    </Row>
  );
};

export default React.memo(PasswordField);
