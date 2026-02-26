# API Directory

This directory explains each [API endpoint](../client/src/api/API.ts) in the front end React app and the purposes they serve. Each function name is linked to the [`/Controller`](../controller/) file that it executes.

## Endpoints

Each category is a link to its [`Routes`](../routes/) or relevant folder.

### **[`Auth`](../auth/)**

- `refreshToken` - JWT token refresh endpoint that validates HTTP-only cookies and issues new access tokens
- `authorizeRequest` - Validates JWT tokens from headers or cookies, handles token verification and rejection
- `guard` - Express middleware for protecting routes with JWT authentication
- `createAccessToken` - Generates JWT access tokens with configurable expiration
- `createRefreshToken` - Generates JWT refresh tokens with 18-day expiration and token version tracking
- `handleTokenRejection` - Clears cookies and logs out users when tokens are invalid

> **📖 For comprehensive authentication system documentation, see [`docs/authentication-system.md`](./authentication-system.md)**

### **[`Users`](../routes/api/users.js)**

- [`updateUser`](../controller/users/account/update.js) updates user document
- [`changePassword`](../controller/users/password/change.js) changes user password (in-app, during a secure session) and invalidates all existing tokens, issues new JWT tokens
- [`resetPassword`](../controller/users/password/reset.js) changes user password (outside of a secure session, user is verified via unique URL)
- [`confirmResetPasswordHash`](../controller/users/password/utils/validate.js) confirms a unique link provided to user if they ask to reset their password
- [`confirmActivationHash`](../controller/users/account/utils/activate.js) confirms a unique link provided to user if they create a new account
- [`deleteUser`](../controller/users/account/remove.js) deletes user account and stored document
- [`login`](../routes/api/middleware/) logs user into the app
- [`checkPrivilege`](../controller/users/account/privileges/certify.js) checks if user has viewed the Eligibility requirements and clicked "Agree". (Users cannot make Celebrations without this)
- [`givePrivilege`](../controller/users/account/privileges/empower.js) updates a user's document to TRUE for the above
- [`promoteDonor`](../controller/users/account/privileges/promote.js) updates a user document to TRUE for the above
- [`getUserData`](../controller/users/account/contact.js) returns any user data that is exposed by the client
- [`forgotPassword`](../controller/users/password/forgot.js) starts process to allow user to reset their password (if they cannot login)
- [`createUser`](../controller/users/account/create.js) creates a new [`User`](../models/User.js) account document,
- [`logout`](../auth/tokenizer.js) logs out user

### **[`Celebrations`](../routes/api/celebrations.js)**

- [`saveCelebration`](../controller/celebrations/create.js) sends payment to Stripe and creates a new Celebration document in the database
- [`getCelebrationsByUserId`](../controller/celebrations/find/params/byUserId.js) returns all Celebration documents from a single user
- [`resolveDonation`](../controller/celebrations/resolve.js) converts a Celebration into a donation by updating the document
- [`sendReceipt`](../controller/celebrations/receipt.js) emails Celebration receipt to user (uses refactored email system)
- [`getWhatPolsHaveInEscrow`](../controller/celebrations/find/params/escrowed.js) sums all donation amounts for each politician from across the userbase

### **[`Congress`](../routes/api/congress.js)**

- [`getPolsByIds`](../controller/congress/methods/put/pols.js) returns a group of **Politicians** based on the ID(s) provided
- [`getPol`](../controller/congress/methods/get/pol.js) returns a single **Politician's** document
- [`getBill`](../controller/congress/methods/get/bill.js) returns a single **Bill's** document

### **[`Payments`](../routes/api/payments.js)** [(Stripe)](https://stripe.com)

- [`sendPayment`](../controller/payments/createPayment.js) sends payment to [`Stripe`](https://stripe.com/docs/payments),
- [`setupIntent`](../controller/payments/setupIntent.js) creates a "payment intent" object
- [`setPaymentMethod`](../controller/payments/setPaymentMethod.js) creates a "payment method" i.e. user's credit card

> **📖 For comprehensive payment processing documentation, see [`docs/payment-processing.md`](./payment-processing.md)**  
> **📖 For webhook processing details, see [`docs/webhooks.md`](./webhooks.md)**

### **[`Location`](../routes/api/civics.js)** [(Google Civics)](https://developers.google.com/civic-information)

- [`getPolsByLocation`](../controller/civics/getLocalPols.js) returns local Representative information (allows user to search by address/ZIP code)

### **[`BTC`](../routes/api/btc.js)**

- [`getBTCAddress`](../services/btc/addressService.js) generates a unique Bitcoin address for donations using HD wallet derivation

> **📖 For comprehensive Bitcoin donations documentation, see [`docs/bitcoin-donations.md`](./bitcoin-donations.md)**

### **[`Sys`](../routes/api/sys.js)**

- [`notifyImgErr`](../controller/sys/notifyImageErr.js) sends an internal system email if a Politician's profile picture is broken/missing (uses refactored email system)
- [`getConstants`](../controller/sys/pullConstants.js) retrieves private constant values stored on the server

### **[`Webhooks`](../routes/api/webhooks.js)**

- [`/api/webhooks/stripe`](../routes/api/webhooks.js) handles Stripe webhook events for payment processing

> **📖 For comprehensive webhook system documentation, see [`docs/webhooks.md`](./webhooks.md)**

## Related Documentation

- [Authentication System](./authentication-system.md) - JWT authentication details
- [Payment Processing](./payment-processing.md) - Stripe integration and escrow
- [Webhook System](./webhooks.md) - Real-time event processing
- [Background Jobs](./background-jobs.md) - Automated monitoring and updates
- [Email System](./email-system.md) - Email notifications
- [Bitcoin Donations](./bitcoin-donations.md) - Cryptocurrency support