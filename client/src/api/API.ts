import type { ResetPasswordRequest } from '@Pages';
import type { AxiosResponse } from 'axios';
import type { Celebration } from '@Types';
import axiosClient from './axiosClient';
import type {
  ConfirmNewPasswordForm,
  ContactInfo,
  HouseMember,
  Intent,
} from '@Interfaces';
import type {
  UserData,
  Settings,
  ServerConstants,
  UserEntryResponse,
} from '@Contexts';

/**
 * @fileoverview API Client for POWERBACK.us Application
 *
 * Complete directory of all API endpoints organized by category:
 *
 * ===== USER MANAGEMENT =====
 * - PUT    /users/update/:userId              - updateUser
 * - PUT    /users/settings/:userId            - updateSettings
 * - PUT    /users/change/:userId              - changePassword
 * - PUT    /users/reset                       - resetPassword
 * - GET    /users/reset/:hash                 - confirmResetPasswordHash
 * - GET    /users/activate/:hash              - confirmActivationHash
 * - GET    /users/unsubscribe/:hash           - verifyUnsubscribeHash
 * - POST   /users/unsubscribe                 - confirmUnsubscribe
 * - DELETE /users/delete/:userId               - deleteUser
 * - POST   /users/login                       - login
 * - POST   /users/refresh                     - refreshToken
 * - GET    /users/privilege/:userId           - checkPrivilege
 * - PATCH  /users/privilege/:userId           - givePrivilege
 * - PATCH  /users/promote/:userId              - promoteDonor
 * - GET    /users/data/:userId                 - getUserData
 * - PUT    /users/forgot                      - forgotPassword
 * - POST   /users                             - createUser
 * - GET    /users/logout                      - logout
 *
 * ===== CELEBRATIONS MANAGEMENT =====
 * - POST   /celebrations                       - saveCelebration
 * - GET    /celebrations/user/:userId          - getCelebrationsByUserId
 * - PATCH  /celebrations/:celebrationId        - resolveDonation
 * - POST   /celebrations/receipt               - sendReceipt
 * - GET    /celebrations/escrow                - getWhatPolsHaveInEscrow
 *
 * ===== PAYMENT PROCESSING (STRIPE) =====
 * - POST   /payments/celebrations/:customer_id - sendPayment
 * - POST   /payments/intents/:id               - setupIntent
 * - POST   /payments/donors/:id                - setPaymentMethod
 * - POST   /payments/check-pac-limit           - checkPACLimit
 *
 * ===== CONGRESS DATA =====
 * - GET    /congress                           - getPols
 * - GET    /congress/members/:pol              - getPol
 * - GET    /congress/election-dates            - getElectionDates
 *
 * ===== LOCATION SERVICES =====
 * - PUT    /civics                             - getPolsByLocation
 *
 * ===== SYSTEM UTILITIES =====
 * - PUT    /sys/errors/img                     - notifyImgErr
 * - POST   /sys/errors/frontend                - logFrontendError
 * - GET    /sys/constants                      - getConstants
 * - POST   /btc/address                        - getBTCAddress
 * - POST   /contact/contributing               - submitContributing
 *
 * @module API
 */

interface PolDonations {
  donation: number;
  pol_id: string;
  count: number;
}

/**
 * API response types
 */

interface AuthResponse extends UserData {
  accessToken: string;
}

interface StripeSetupResponse {
  customer: string;
  clientSecret: string;
}

export interface StripePaymentResponse {
  paymentIntent: string;
  clientSecret: string;
}

export interface PaymentValidationResponse {
  donation: number;
  complies: boolean;
  has_stakes: boolean;
  understands: boolean;
  tip?: number;
  tipComplies?: boolean;
  pacLimitInfo?: {
    currentPACTotal: number;
    pacLimit: number;
    remainingPACLimit: number;
    message: string;
  };
}

interface PACLimitResponse {
  isCompliant: boolean;
  currentPACTotal: number;
  pacLimit: number;
  remainingPACLimit: number;
  message: string;
}

interface HashConfirmation {
  isHashConfirmed: boolean;
  isLinkExpired: boolean;
  [key: string]: unknown;
}

interface ChangePasswordResponse {
  message: string;
  accessToken: string;
}

/** Response shape from PATCH /users/promote/:userId (compliance promotion). */
interface PromoteDonorResponse {
  promotion: { compliance: string; updated: boolean };
  updated: UserData;
  district: string;
}

/**
 * API service interface for POWERBACK.us application
 * Provides methods for user management, celebrations, payments, and data retrieval
 */
interface PowerbackAPI {
  // User Management
  updateUser: (
    userId: string,
    userData: ContactInfo & {
      resetPasswordHash: string;
      resetPasswordHashExpires: Date;
      resetPasswordHashIssueDate: Date;
    }
  ) => Promise<AxiosResponse<UserData>>;
  updateSettings: (
    userId: string,
    settings: { settings: Settings }
  ) => Promise<AxiosResponse<UserData>>;
  changePassword: (
    userId: string,
    changeRequest: ConfirmNewPasswordForm
  ) => Promise<AxiosResponse<ChangePasswordResponse>>;
  resetPassword: (
    resetPassword: ResetPasswordRequest
  ) => Promise<AxiosResponse<{ message: string }>>;
  confirmResetPasswordHash: (
    hash: string
  ) => Promise<AxiosResponse<HashConfirmation>>;
  confirmActivationHash: (
    hash: string
  ) => Promise<AxiosResponse<HashConfirmation>>;
  verifyUnsubscribeHash: (
    hash: string
  ) => Promise<AxiosResponse<{ isValid: boolean; isExpired: boolean }>>;
  confirmUnsubscribe: (
    hash: string,
    topic: string
  ) => Promise<AxiosResponse<{ success: boolean }>>;
  deleteUser: (userId: string) => Promise<AxiosResponse<void>>;
  login: (
    credentials: UserEntryResponse
  ) => Promise<AxiosResponse<AuthResponse>>;
  refreshToken: () => Promise<AxiosResponse<AuthResponse>>;
  checkPrivilege: (userId: string) => Promise<AxiosResponse<boolean>>;
  givePrivilege: (
    userId: string
  ) => Promise<AxiosResponse<{ acknowledged: boolean }>>;
  promoteDonor: (
    userId: string,
    formData?: ContactInfo
  ) => Promise<AxiosResponse<PromoteDonorResponse>>;
  getUserData: (userId: string) => Promise<AxiosResponse<UserData>>;
  forgotPassword: (email: string) => Promise<AxiosResponse<void>>;
  createUser: (userData: UserEntryResponse) => Promise<AxiosResponse<UserData>>;
  logout: () => Promise<AxiosResponse<void>>;

  // Celebrations Management
  saveCelebration: (
    celebration: Celebration
  ) => Promise<AxiosResponse<Celebration>>;
  getCelebrationsByUserId: (
    userId: string
  ) => Promise<AxiosResponse<Celebration[]>>;
  resolveDonation: (celebrationId: string) => Promise<AxiosResponse<void>>;
  sendReceipt: (celebration: Celebration) => Promise<AxiosResponse<void>>;
  getWhatPolsHaveInEscrow: () => Promise<AxiosResponse<PolDonations[]>>;

  // Payment Processing
  sendPayment: (
    customer_id: string,
    celebration: Celebration
  ) => Promise<
    AxiosResponse<StripePaymentResponse | PaymentValidationResponse>
  >;
  setupIntent: (
    id: string,
    body: Intent
  ) => Promise<AxiosResponse<StripeSetupResponse>>;
  setPaymentMethod: (id: string, body: Intent) => Promise<AxiosResponse<void>>;
  checkPACLimit: (
    userId: string,
    tipAmount: number
  ) => Promise<AxiosResponse<PACLimitResponse>>;

  // Congress Data
  getPols: () => Promise<AxiosResponse<HouseMember[]>>;
  getPol: (pol: string) => Promise<AxiosResponse<HouseMember>>;
  getElectionDates: () => Promise<
    AxiosResponse<{
      success: boolean;
      data: Record<string, { primary: string; general: string }>;
      source: string;
      timestamp: string;
    }>
  >;

  // Location Services
  getPolsByLocation: (address: string) => Promise<AxiosResponse<string>>;

  // System Utilities
  getBTCAddress: () => Promise<AxiosResponse<{ address: string }>>;
  notifyImgErr: (pol: string) => Promise<AxiosResponse<boolean>>;
  logFrontendError: (errorData: {
    message: string;
    stack?: string;
    componentStack?: string;
    url?: string;
  }) => Promise<AxiosResponse<{ success: boolean }>>;
  getConstants: () => Promise<AxiosResponse<ServerConstants>>;
  submitContributing: (body: {
    name: string;
    email: string;
    githubUrl?: string;
    message?: string;
  }) => Promise<AxiosResponse<{ success: boolean }>>;
}

const API: PowerbackAPI = {
  // ===== USER MANAGEMENT =====

  /**
   * Updates user profile information
   * @param userId - The unique identifier for the user
   * @param userData - ContactInfo object containing updated user data
   * @returns Promise with the updated user data
   * @example
   * ```typescript
   * const updatedUser = await API.updateUser(user.id, {
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   address: '123 Main St',
   *   city: 'Anytown',
   *   state: 'NY',
   *   zip: '12345'
   * });
   * console.log(`Updated profile for ${updatedUser.firstName} ${updatedUser.lastName}`);
   * ```
   */
  updateUser: (
    userId: string,
    userData: ContactInfo
  ): Promise<AxiosResponse<UserData>> => {
    return axiosClient.put('users/update/' + userId, userData);
  },

  /**
   * Updates user settings/preferences
   * @param userId - The unique identifier for the user
   * @param settings - Settings object containing user preferences
   * @returns Promise with the updated user data
   * @example
   * ```typescript
   * const updatedUser = await API.updateSettings(user.id, {
   *   settings: {
   *     emailReceipts: true,
   *     showToolTips: false,
   *     autoTweet: true,
   *     unsubscribedFrom: ['election_updates']
   *   }
   * });
   * ```
   */
  updateSettings: (
    userId: string,
    settings: { settings: Settings }
  ): Promise<AxiosResponse<UserData>> => {
    return axiosClient.put('users/settings/' + userId, settings);
  },

  /**
   * Changes user password with current and new password validation
   * @param userId - The unique identifier for the user
   * @param changeRequest - ChangePassword object containing current and new passwords
   * @returns Promise indicating success or failure of password change
   * @example
   * ```typescript
   * const result = await API.changePassword(user.id, {
   *   username: 'user@example.com',
   *   currentPassword: 'oldPassword123',
   *   newPassword: 'newSecurePassword456'
   * });
   * console.log(result.message); // "Your password has been successfully changed."
   * ```
   */
  changePassword: (
    userId: string,
    changeRequest: ConfirmNewPasswordForm
  ): Promise<AxiosResponse<ChangePasswordResponse>> => {
    return axiosClient.put('users/change/' + userId, changeRequest);
  },

  /**
   * Resets user password using reset token and new password
   * @param credentials - ResetPasswordRequest object containing reset token and new password
   * @returns Promise indicating success or failure of password reset
   * @example
   * ```typescript
   * const result = await API.resetPassword({
   *   newPassword: 'newSecurePassword456',
   *   givenUsername: 'user@example.com'
   * });
   * console.log(result.message); // "Your password has been successfully reset."
   * ```
   */
  resetPassword: (
    resetPassword: ResetPasswordRequest
  ): Promise<AxiosResponse<{ message: string }>> => {
    return axiosClient.put('users/reset', resetPassword);
  },

  /**
   * Validates password reset hash token
   * @param hash - The password reset hash token to validate
   * @returns Promise with validation result and user info if valid
   * @example
   * ```typescript
   * const validation = await API.confirmResetPasswordHash('abc123def456');
   * if (validation.isHashConfirmed && !validation.isLinkExpired) {
   *   // Show password reset form
   * } else if (validation.isLinkExpired) {
   *   console.log('Reset link has expired');
   * }
   * ```
   */
  confirmResetPasswordHash: (
    hash: string
  ): Promise<AxiosResponse<HashConfirmation>> => {
    return axiosClient.get('users/reset/' + hash);
  },

  /**
   * Validates account activation hash token
   * @param hash - The account activation hash token to validate
   * @returns Promise with validation result and user info if valid
   * @example
   * ```typescript
   * const activation = await API.confirmActivationHash('xyz789abc123');
   * if (activation.isHashConfirmed && !activation.isLinkExpired) {
   *   console.log('Account successfully activated!');
   * } else {
   *   console.log('Invalid or expired activation link');
   * }
   * ```
   */
  confirmActivationHash: (
    hash: string
  ): Promise<AxiosResponse<HashConfirmation>> => {
    return axiosClient.get('users/activate/' + hash);
  },

  /**
   * Validates unsubscribe hash token
   * @param hash - The unsubscribe hash token to validate
   * @returns Promise with validation result
   */
  verifyUnsubscribeHash: (
    hash: string
  ): Promise<AxiosResponse<{ isValid: boolean; isExpired: boolean }>> => {
    return axiosClient.get('users/unsubscribe/' + hash);
  },

  /**
   * Confirms unsubscribe from topic
   * @param hash - The unsubscribe hash token
   * @param topic - The topic to unsubscribe from
   * @returns Promise indicating success
   */
  confirmUnsubscribe: (
    hash: string,
    topic: string
  ): Promise<AxiosResponse<{ success: boolean }>> => {
    return axiosClient.post('users/unsubscribe', { hash, topic });
  },

  /**
   * Permanently deletes a user account and all associated data
   * @param userId - The unique identifier for the user to delete
   * @returns Promise indicating success or failure of account deletion
   * @warning This action is irreversible
   * @example
   * ```typescript
   * await API.deleteUser(user.id);
   * console.log('Account permanently deleted');
   * // User will receive confirmation email
   * ```
   */
  deleteUser: (userId: string): Promise<AxiosResponse<void>> => {
    return axiosClient.delete('users/delete/' + userId);
  },

  /**
   * Authenticates user with username/email and password
   * @param credentials - UserEntryResponse object containing login credentials
   * @returns Promise with authentication token and user data
   * @example
   * ```typescript
   * const { data: authResult } = await API.login({
   *   username: 'user@example.com',
   *   password: 'securePassword123'
   * });
   * localStorage.setItem('token', authResult.token);
   * ```
   */
  login: (
    credentials: UserEntryResponse
  ): Promise<AxiosResponse<AuthResponse>> => {
    return axiosClient.post('users/login', credentials);
  },

  /**
   * Refreshes authentication token using HTTP-only cookie and CSRF protection.
   * Includes CSRF token from cookies in the request headers according to backend requirements.
   * @returns Promise with new authentication token and user data
   * @example
   * ```typescript
   * try {
   *   const { data: tokenData } = await API.refreshToken();
   *   localStorage.setItem('token', tokenData.accessToken);
   * } catch (error) {
   *   // Redirect to login if refresh fails
   *   window.location.href = '/login';
   * }
   * ```
   * @remarks
   * The request sends an empty body, includes credentials, and sets 'X-CSRF-Token' header if available.
   */
  refreshToken: async (): Promise<AxiosResponse<AuthResponse>> => {
    return axiosClient.post('users/refresh', {});
  },

  /**
   * Checks if user has agreed to the terms of service and therefore has the privilege of using the service (understands = true)
   * @param userId - The unique identifier for the user
   * @returns Promise with boolean indicating if user has privileges
   * @example
   * ```typescript
   * const response = await API.checkPrivilege(user.id);
   * if (response.data.understands) {
   *   // User has agreed to terms and can use advanced features
   * }
   * // Or destructure for convenience:
   * const { data: privileges } = await API.checkPrivilege(user.id);
   * if (privileges.understands) {
   *   // User has agreed to terms
   * }
   * ```
   */
  checkPrivilege: (userId: string): Promise<AxiosResponse<boolean>> => {
    return axiosClient.get('/users/privilege/' + userId);
  },

  /**
   * Sets user understands flag to true (grants elevated privileges of using the service to the user)
   * @param userId - The unique identifier for the user to empower
   * @returns Promise indicating success or failure of privilege grant
   * @example
   * ```typescript
   * const result = await API.givePrivilege(user.id);
   * if (result.acknowledged) {
   *   console.log('User now has elevated privileges');
   * }
   * ```
   */
  givePrivilege: (
    userId: string
  ): Promise<AxiosResponse<{ acknowledged: boolean }>> => {
    return axiosClient.patch('/users/privilege/' + userId);
  },

  /**
   * Promotes user to compliant status based on profile completeness, substantially raising their donation limit
   * @param userId - The unique identifier for the user to promote
   * @param formData - Optional form data to send for promotion validation
   * @returns Promise with updated user data, promotion result, and district information
   * @example
   * ```typescript
   * const result = await API.promoteDonor(user.id, contactInfo);
   * console.log('Updated user compliance:', result.updated.compliance);
   * console.log('Promotion result:', result.promotion);
   * console.log('Congressional district:', result.district);
   * ```
   */
  promoteDonor: (
    userId: string,
    formData?: ContactInfo
  ): Promise<AxiosResponse<PromoteDonorResponse>> => {
    return axiosClient.patch('/users/promote/' + userId, formData);
  },

  /**
   * Retrieves comprehensive user profile data
   * @param userId - The unique identifier for the user
   * @returns Promise with complete user profile information
   * @example
   * ```typescript
   * const userData = await API.getUserData(user.id);
   * console.log(`User: ${userData.firstName} ${userData.lastName}`);
   * console.log(`Compliance level: ${userData.compliance}`);
   * console.log(`Donations: ${userData.donations?.length || 0}`);
   * ```
   */
  getUserData: (userId: string): Promise<AxiosResponse<UserData>> => {
    return axiosClient.get('users/data/' + userId);
  },

  /**
   * Initiates password reset process by sending reset email
   * @param email - Email address to send password reset link to
   * @returns Promise indicating success or failure of email sending
   * @example
   * ```typescript
   * await API.forgotPassword('user@example.com');
   * // User will receive email with reset link if account exists
   * console.log('Password reset email sent if account exists');
   * ```
   */
  forgotPassword: (email: string): Promise<AxiosResponse<void>> => {
    return axiosClient.put('users/forgot', email);
  },

  /**
   * Creates a new user account with validation and activation email
   * @param userData - UserEntryResponse object containing new user information
   * @returns Promise with new user data and activation instructions
   * @example
   * ```typescript
   * const newUser = await API.createUser({
   *   username: 'newuser@example.com',
   *   password: 'securePassword123',
   *   firstName: 'Jane',
   *   lastName: 'Smith'
   * });
   * console.log(`Account created for ${newUser.firstName}. Check email for activation link.`);
   * ```
   */
  createUser: (
    userData: UserEntryResponse
  ): Promise<AxiosResponse<UserData>> => {
    return axiosClient.post('users', userData);
  },

  /**
   * Logs out user and invalidates authentication tokens
   * Includes CSRF token from cookies in the request headers according to backend requirements.
   * @returns Promise indicating successful logout
   * @example
   * ```typescript
   * await API.logout();
   * localStorage.removeItem('token');
   * window.location.href = '/login';
   * ```
   */
  logout: (): Promise<AxiosResponse<void>> => {
    return axiosClient.get('users/logout');
  },

  // ===== CELEBRATIONS MANAGEMENT =====

  /**
   * Saves a new celebration to the database
   * @param celebration - Celebration object containing event details and donation info
   * @returns Promise with saved celebration data including unique ID
   * @example
   * ```typescript
   * const { data: newCelebration } = await API.saveCelebration({
   *   pol_id: 'K000367',
   *   donation: 100,
   *   tip: 5,
   *   bill_id: 'hr1-117',
   *   donatedBy: user.id
   * });
   * console.log(`Celebration created with ID: ${newCelebration._id}`);
   * ```
   */
  saveCelebration: (
    celebration: Celebration
  ): Promise<AxiosResponse<Celebration>> => {
    return axiosClient.post('celebrations', celebration);
  },

  /**
   * Retrieves all celebrations created by a specific user
   * @param userId - The unique identifier for the user
   * @returns Promise with array of user's celebrations
   * @example
   * ```typescript
   * const userCelebrations = await API.getCelebrationsByUserId(user.id);
   * const totalDonated = userCelebrations.reduce((sum, c) => sum + c.donation, 0);
   * console.log(`User has ${userCelebrations.length} celebrations totaling $${totalDonated}`);
   * ```
   */
  getCelebrationsByUserId: (
    userId: string
  ): Promise<AxiosResponse<Celebration[]>> => {
    return axiosClient.get('celebrations/user/' + userId);
  },

  /**
   * Marks a celebration as satisfied (resolved) with timestamp
   * @param celebrationId - The unique identifier for the celebration
   * @returns Promise indicating successful resolution update
   * @example
   * ```typescript
   * await API.resolveDonation('celebration_id_123');
   * console.log('Celebration marked as satisfied - donation will be processed');
   * ```
   */
  resolveDonation: (celebrationId: string): Promise<AxiosResponse<void>> => {
    return axiosClient.patch('celebrations/' + celebrationId);
  },

  /**
   * Sends donation receipt email to user
   * @param celebration - Celebration object containing receipt details
   * @returns Promise indicating successful receipt sending
   * @example
   * ```typescript
   * await API.sendReceipt({
   *   ...celebrationData,
   *   donee: politician,
   *   bill: billData,
   *   ordinal: 1
   * });
   * console.log('Receipt email sent to user');
   * ```
   */
  sendReceipt: (celebration: Celebration): Promise<AxiosResponse<void>> => {
    return axiosClient.post('celebrations/receipt', celebration);
  },

  /**
   * Gets summary of funds held in escrow for all politicians
   * @returns Promise with escrow balance information by politician
   * @example
   * ```typescript
   * const { data: escrowSummary } = await API.getWhatPolsHaveInEscrow();
   * const totalEscrowed = escrowSummary.reduce((sum, pol) => sum + pol.donation, 0);
   * console.log(`Total funds in escrow: $${totalEscrowed}`);
   * ```
   */
  getWhatPolsHaveInEscrow: (): Promise<AxiosResponse<PolDonations[]>> => {
    return axiosClient.get('celebrations/escrow');
  },

  // ===== PAYMENT PROCESSING (STRIPE) =====

  /**
   * Processes payment for a celebration using Stripe
   * @param customer_id - Stripe customer ID for the user
   * @param celebration - Celebration object containing payment details
   * @returns Promise with payment processing result
   * @example
   * ```typescript
   * const paymentResult = await API.sendPayment('cus_1234567890', {
   *   donation: 100,
   *   tip: 5,
   *   fee: 3.20,
   *   pol_id: 'K000367',
   *   bill_id: 'hr1-117',
   *   idempotencyKey: 'unique-key-123'
   * });
   * console.log(`Payment intent: ${paymentResult.paymentIntent}`);
   * ```
   */
  sendPayment: (
    customer_id: string,
    celebration: Celebration
  ): Promise<
    AxiosResponse<StripePaymentResponse | PaymentValidationResponse>
  > => {
    return axiosClient.post(
      'payments/celebrations/' + customer_id,
      celebration
    );
  },

  /**
   * Sets up payment intent for future payments
   * @param id - User or customer identifier
   * @param body - Intent object containing payment setup details
   * @returns Promise with setup intent client secret
   * @example
   * ```typescript
   * const setupResult = await API.setupIntent('cus_1234567890', {
   *   idempotencyKey: 'setup-key-123'
   * });
   * // Use setupResult.clientSecret with Stripe Elements
   * console.log(`Setup client secret: ${setupResult.clientSecret}`);
   * ```
   */
  setupIntent: (
    id: string,
    body: Intent
  ): Promise<AxiosResponse<StripeSetupResponse>> => {
    return axiosClient.post('payments/intents/' + id, body);
  },

  /**
   * Associates payment method with user account
   * @param id - User identifier
   * @param body - Intent object containing payment method details
   * @returns Promise indicating successful payment method setup
   * @example
   * ```typescript
   * await API.setPaymentMethod('cus_1234567890', {
   *   payment_method: 'pm_1234567890',
   *   idempotencyKey: 'payment-method-key-123'
   * });
   * console.log('Payment method saved as default');
   * ```
   */
  setPaymentMethod: (
    id: string,
    body: Intent
  ): Promise<AxiosResponse<void>> => {
    return axiosClient.post('payments/donors/' + id, body);
  },

  /**
   * Checks if a tip would exceed PAC annual limit
   * @param userId - The unique identifier for the user
   * @param tipAmount - The tip amount to validate
   * @returns Promise with PAC limit validation result
   * @example
   * ```typescript
   * const pacLimitCheck = await API.checkPACLimit(user.id, 100);
   * if (pacLimitCheck.isCompliant) {
   *   console.log(`Tip is within PAC limits. Current PAC total: $${pacLimitCheck.currentPACTotal}. Remaining limit: $${pacLimitCheck.remainingPACLimit}`);
   * } else {
   *   console.log(`Tip exceeds PAC limits. Message: ${pacLimitCheck.message}`);
   * }
   * ```
   */
  checkPACLimit: (
    userId: string,
    tipAmount: number
  ): Promise<AxiosResponse<PACLimitResponse>> => {
    return axiosClient.post('payments/check-pac-limit', { userId, tipAmount });
  },

  // ===== CONGRESS DATA =====

  /**
   * Retrieves list of Congress members that have stakes (campaigns with challengers)
   * @returns Promise with array of politician data filtered by has_stakes = true
   * @example
   * ```typescript
   * const { data: politicians } = await API.getPols();
   * const republicans = politicians.filter(pol => pol.party === 'R');
   * console.log(`Found ${republicans.length} Republican politicians with active campaigns`);
   * ```
   */
  getPols: (): Promise<AxiosResponse<HouseMember[]>> => {
    return axiosClient.get('congress');
  },

  /**
   * Retrieves detailed information for a specific politician
   * @param pol - Politician identifier (bioguide ID or slug)
   * @returns Promise with detailed politician profile data
   * @example
   * ```typescript
   * const politician = await API.getPol('K000367');
   * console.log(`${politician.first_name} ${politician.last_name} from ${politician.roles[0].state}`);
   * console.log(`Has stakes: ${politician.has_stakes}`);
   * ```
   */
  getPol: (pol: string): Promise<AxiosResponse<HouseMember>> => {
    return axiosClient.get('congress/members/' + pol);
  },

  // ===== LOCATION-BASED SEARCH (GOOGLE CIVICS) =====

  /**
   * Gets congressional district OCD ID for a given address using Google Civics API
   * @param address - Street address, city, state, or ZIP code to search
   * @returns Promise with OCD ID string or 'prompt-requery' if incomplete
   * @example
   * ```typescript
   * const ocdId = await API.getPolsByLocation('1600 Pennsylvania Ave, Washington DC');
   * if (ocdId === 'prompt-requery') {
   *   // Ask user for more complete address
   * } else {
   *   console.log(`Congressional district: ${ocdId}`);
   * }
   * ```
   */
  getPolsByLocation: (address: string): Promise<AxiosResponse<string>> => {
    return axiosClient.put('civics', { address });
  },

  // ===== SYSTEM UTILITIES =====

  /**
   * Reports broken politician image to system administrators
   * @param pol - Politician identifier with broken image
   * @returns Promise indicating successful error report
   * @example
   * ```typescript
   * const reported = await API.notifyImgErr('K000367');
   * if (reported) {
   *   console.log('Image error reported to administrators');
   * }
   * ```
   */
  notifyImgErr: (pol: string): Promise<AxiosResponse<boolean>> => {
    return axiosClient.put('sys/errors/img', { pol });
  },

  /**
   * Logs frontend JavaScript error from ErrorBoundary
   * @param errorData - Error information including message, stack, and component stack
   * @returns Promise indicating successful error logging
   * @example
   * ```typescript
   * await API.logFrontendError({
   *   message: error.message,
   *   stack: error.stack,
   *   componentStack: errorInfo.componentStack,
   *   url: window.location.href
   * });
   * ```
   */
  logFrontendError: (errorData: {
    message: string;
    stack?: string;
    componentStack?: string;
    url?: string;
  }): Promise<AxiosResponse<{ success: boolean }>> => {
    return axiosClient.post('sys/errors/frontend', errorData);
  },

  /**
   * Retrieves safe server constants (excludes sensitive API keys and secrets)
   * @returns Promise with sanitized application constants
   * @example
   * ```typescript
   * const constants = await API.getConstants();
   * console.log(`FEC donation limits: $${constants.FEC.COMPLIANCE_TIERS.guest.perDonationLimit()} / $${constants.FEC.COMPLIANCE_TIERS.compliant.perElectionLimit()}`);
   * console.log(`Suggested amounts: ${constants.SUGGESTED[0]}`);
   * ```
   */
  getConstants: (): Promise<AxiosResponse<ServerConstants>> => {
    return axiosClient.get('sys/constants');
  },

  /**
   * Retrieves election dates for all states from the server
   * @returns Promise with election dates data including source and timestamp
   * @example
   * ```typescript
   * const electionDates = await API.getElectionDates();
   * if (electionDates.success) {
   *   console.log(`CA Primary: ${electionDates.data.CA.primary}`);
   *   console.log(`CA General: ${electionDates.data.CA.general}`);
   * }
   * ```
   */
  getElectionDates: (): Promise<
    AxiosResponse<{
      success: boolean;
      data: Record<string, { primary: string; general: string }>;
      source: string;
      timestamp: string;
    }>
  > => {
    return axiosClient.get('congress/election-dates');
  },

  /**
   * Retrieves a dynamically generated Bitcoin address
   * @returns Promise with a Bitcoin address
   * @example
   * ```typescript
   * const response = await API.getBTCAddress();
   * console.log(`BTC Address: ${response.data.address}`);
   * ```
   */
  getBTCAddress: (): Promise<AxiosResponse<{ address: string }>> => {
    return axiosClient.post('btc/address');
  },

  /**
   * Submits the contributing inquiry form (name, email, GitHub link, message)
   * @param body - Form data
   * @returns Promise with { success: true }
   */
  submitContributing: (body: {
    name: string;
    email: string;
    githubUrl?: string;
    message?: string;
  }): Promise<AxiosResponse<{ success: boolean }>> => {
    return axiosClient.post('contact/contributing', body);
  },
};

export type { PolDonations };
export default API;
