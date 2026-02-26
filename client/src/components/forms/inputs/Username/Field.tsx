import React from 'react';
import {
  Col,
  Row,
  FormGroup,
  FormLabel,
  FormControl,
  InputGroup,
} from 'react-bootstrap';
import type { Props } from '../Props';
import './style.css';

const UsernameField = ({
  pattern = '^[\\w\\.]+@[a-zA-Z_]+?\\.[a-zA-Z]{2,3}$',
  autoComplete,
  hideFeedback,
  placeholder,
  cls = '',
  feedback,
  onChange,
  label,
  value,
}: Props) => (
  <Row className={cls}>
    <Col
      xs={12}
      className={'userpass--field'}
    >
      <FormLabel htmlFor={'validation-username'}>{label}</FormLabel>
      <FormGroup
        className={'form-input-wfeedback'}
        controlId={'validation-username'}
      >
        <InputGroup
          hasValidation
          className='form-group'
        >
          <InputGroup.Text className='input-icon l'>
            <i
              title='envelope icon'
              className='bi bi-envelope-fill'
            />
          </InputGroup.Text>

          <FormControl
            required
            value={value}
            type={'email'}
            name={'username'}
            pattern={pattern}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
          <InputGroup.Text className='input-icon r'>
            <i
              title='envelope icon'
              className='bi bi-envelope-fill'
            />
          </InputGroup.Text>
          <FormControl.Feedback type={'invalid'}>
            {feedback}
          </FormControl.Feedback>
          <FormControl.Feedback
            type={'valid'}
            hidden={hideFeedback}
          >
            {feedback}
          </FormControl.Feedback>
        </InputGroup>
      </FormGroup>
    </Col>
  </Row>
);

export default React.memo(UsernameField);
