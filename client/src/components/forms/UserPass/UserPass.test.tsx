import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPass from './UserPass';

// Mock the child components
jest.mock('../inputs', () => ({
  UsernameField: ({ label }: any) => (
    <div data-testid='username-field'>{label}</div>
  ),
  PasswordField: ({ label }: any) => (
    <div data-testid='password-field'>{label}</div>
  ),
}));

jest.mock('@Components/displays', () => ({
  BtnErrorSwapper: ({ btnProps }: any) => (
    <button data-testid='submit-button'>{btnProps.value}</button>
  ),
}));

describe('UserPass Component', () => {
  const defaultProps = {
    value: 'Submit',
    uValue: '',
    pValue: '',
    uLabel: 'Username',
    pLabel: 'Password',
    uFeedback: '',
    pFeedback: '',
    hideFeedback: false,
    uAutoComplete: 'username',
    pAutoComplete: 'current-password',
    userFormValidated: false,
    buttonErrorSwapper: {
      showError: false,
      view: { icon: '', msg: '' },
    },
    handleChange: jest.fn(),
    handleSubmit: jest.fn(),
  };

  it('renders username and password fields', () => {
    render(<UserPass {...defaultProps} />);

    expect(screen.getByTestId('username-field')).toBeInTheDocument();
    expect(screen.getByTestId('password-field')).toBeInTheDocument();
  });

  it('renders submit button with correct text', () => {
    render(<UserPass {...defaultProps} />);

    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent('Submit');
  });

  it('passes correct labels to input fields', () => {
    render(<UserPass {...defaultProps} />);

    expect(screen.getByTestId('username-field')).toHaveTextContent(
      'Username'
    );
    expect(screen.getByTestId('password-field')).toHaveTextContent(
      'Password'
    );
  });
});
