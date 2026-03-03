import React, {
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
  type ChangeEvent,
  type FormEventHandler,
} from 'react';
import { Col, Row, Form } from 'react-bootstrap';
import { SubmitBtn } from '@Components/buttons';
import { ACCOUNT_COPY } from '@CONSTANTS';
import './style.css';

type DeleteAcctProps = {
  handleDeleteUser: () => void;
};

const PATTERN = ACCOUNT_COPY.APP.DELETE_ACCOUNT_PATTERN;

const DeleteAcct = ({ handleDeleteUser }: DeleteAcctProps) => {
  const [isInvalid, setIsInvalid] = useState(false),
    [buttonIsHidden, setButtonIsHidden] = useState(true),
    [deleteAcctInput, setDeleteAcctInput] = useState('');

  const wrongEntry = useMemo(() => {
    return deleteAcctInput !== PATTERN;
  }, [deleteAcctInput]);

  const handleHideButton = useCallback(() => {
    setButtonIsHidden(wrongEntry);
    if (wrongEntry) setDeleteAcctInput('');
  }, [wrongEntry, setButtonIsHidden]);

  useLayoutEffect(() => {
    handleHideButton();
  }, [wrongEntry, handleHideButton]);

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteAcctInput('');
        setButtonIsHidden(true);
        (handleDeleteUser as () => void)();
      },
      [handleDeleteUser, setButtonIsHidden]
    ),
    handleInputChange = useCallback((e: ChangeEvent) => {
      setIsInvalid(true);
      if (typeof e === 'object')
        setDeleteAcctInput((e.target as HTMLInputElement).value);
      else setDeleteAcctInput('');
    }, []);

  return (
    <Form
      noValidate
      validated={isInvalid}
      onSubmit={handleSubmit}
      id={'delete-modal-input'}
      className={'pt-lg-3'}
    >
      <Form.Group controlId='formDeleteAccount'>
        <Form.Text>
          <p className='delete-acct-instructions pb-1'>
            To delete your account, type:
            <br />
            <span className='input-pattern'>{PATTERN}</span>
            <br />
            then click "DELETE ACCOUNT"
          </p>
        </Form.Text>
        <Form.Control
          onChange={(e) => handleInputChange(e)}
          className={'my-lg-2 mb-lg-2'}
          onPaste={(e) => {
            e.preventDefault();
            return false;
          }}
          pattern={PATTERN}
          type={'text'}
          required
        />
        <Row>
          {!buttonIsHidden && (
            <Col className='pb-lg-1 pt-lg-0 py-1'>
              <i className='bi bi-exclamation-triangle-fill text-danger' />{' '}
              <i className='no-refunds text-uppercase small'>
                Pending Celebrations are NOT refunded!{' '}
              </i>
              <i className='bi bi-exclamation-triangle-fill text-danger' />
            </Col>
          )}
        </Row>
      </Form.Group>
      <Form.Group className='mt-1 mt-lg-2'>
        <SubmitBtn
          classProp={'delete-account-btn'}
          btnId={'delete-acct--btn'}
          value={'DELETE ACCOUNT'}
          hidden={buttonIsHidden}
          variant={'danger'}
          size={'lg'}
        />
      </Form.Group>
    </Form>
  );
};

export default React.memo(DeleteAcct);
