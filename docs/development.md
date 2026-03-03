# POWERBACK.us Development Setup Guide

We greatly appreciate your interest in contributing to our project. This guide will help you set up your development environment and run a local instance of **POWERBACK.us** for testing and development.

- [Prerequisites](#prerequisites)
- [Installation](#installation-guide)
  - [Environment Variables](#environment-variables)
  - [Backend Constants](#backend-constants)
  - [Development Server](#start-the-development-server)
- [Making Contributions](#making-contributions)
- [Questions and Support](#questions-and-support)

## Prerequisites

Before you begin, ensure you have the following prerequisites installed on your development machine. See [Version Information](./version.md) for current dependency versions.

- [Node.js](https://nodejs.org/) (version 20.19.6 - see `.nvmrc`)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [MongoDB](https://www.mongodb.com/) (local installation recommended - see [Local MongoDB Setup Guide](./local-mongodb-setup.md))
- [Git](https://git-scm.com/)

## Installation

1. **Clone the Repository:**

   Start by cloning the **POWERBACK.us** repository to your local machine. Run the following command in your terminal:

   ```bash
   git clone https://github.com/yourusername/powerback.git
   ```

2. **Install Dependencies:**

   Navigate to the project directory and install the project dependencies using npm:

   ```bash
   cd powerback && npm install
   ```

3. ## Environment Variables:

   **POWERBACK.us** uses a simple `.env` file approach for environment management. The canonical variable list and comments live in the example templates (safe to commit; no secrets):
   - **Backend**: Copy `.env.example.backend` to `.env.local` in the project root.
   - **Client**: Copy `client/.env.example.client` to `client/.env.local`.

   Replace all placeholders; the example files include comments on where to get API keys and which variables are required. For a minimal reference, see the snippet below:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3001
   ORIGIN=http://localhost:3000

   # Database (Local MongoDB - recommended for development)
   # See docs/local-mongodb-setup.md for installation instructions
   MONGODB_URI=mongodb://127.0.0.1:27017/powerback

   # Authentication
   JWT_SECRET=your-jwt-secret
   SESSION_SECRET=your-session-secret
   SALT_WORK_FACTOR=10

   # API Keys
   FEC_API_KEY=your-fec-key
   GOOGLE_CIVICS_API_KEY=your-civics-key
   CONGRESS_GOV_API_KEY=your-congress-key

   # Note: If Google API is configured with IP restrictions, add your local dev machine's IP to the allowlist
   # See docs/keylist.md for detailed setup instructions

   # Stripe Configuration
   STRIPE_SK_TEST=sk_test_...
   STRIPE_PK_TEST=pk_test_...
   STRIPE_SIGNING_SECRET_WORKBENCH=whsec_...
   STRIPE_SIGNING_SECRET_CLI=whsec_...

   # Email Configuration
   EMAIL_DOMAIN=powerback.us
   EMAIL_HOST=mail.powerback.us
   EMAIL_JONATHAN_USER=your-email@powerback.us
   EMAIL_JONATHAN_PASS=your-email-password
   EMAIL_NO_REPLY_PASS=your-no-reply-password

   # URLs and External Services
   DEV_URL=http://localhost:3000/
   PROD_URL=https://powerback.us/
   API_BASEURL=http://localhost:3001/api/

   # Optional: H.J.Res.54 bill-update webhook (e.g. Make.com). When set, the checkHJRes54 job POSTs a JSON payload here when the bill has new activity. See docs/webhooks.md.
   # HJRES54_WEBHOOK_URL=https://hook.us2.make.com/...
   ```

   ### Environment File Management:
   - **Development**: Use test keys and **local database** (recommended - see [Local MongoDB Setup Guide](./local-mongodb-setup.md))
   - **Remote Development**: For remote MongoDB setup, see [Remote MongoDB Setup Guide](./remote-mongodb-setup.md)
   - **Production**: Use live keys and production database
   - **GitHub**: Never commit `.env` files - they're gitignored

4. ## Backend Constants and shared (REACT*APP*) variables

   **POWERBACK.us** uses a centralized constants system in the `constants/` directory. Constants are loaded from environment variables. All **shared** configuration (used by both backend and frontend) uses the **REACT*APP*** prefix so the same names work in `.env`/`.env.local` and in production (`/etc/powerback/public.env`). See [Environment Management](./environment-management.md#shared-react_app_-variables) for the full list of shared variables.

   ### Constants Structure:

   ```javascript
   // constants/index.js - Main constants aggregator
   const { emailTopics } = require('../shared');
   const { SERVER } = require('./server');
   const { APP } = require('./app');
   const { FEC } = require('./fec');

   module.exports = {
     emailTopics,
     SERVER,
     FEC,
     APP,
   };
   ```

   **Note**: API keys (Google Civics, FEC, Congress, Stripe) are accessed directly from environment variables via `process.env`, not through the constants system.

   ### Environment-Based Configuration:

   The system automatically uses the correct configuration based on the environment variables in your `.env` file:
   - **Development**: Uses test keys and local database
   - **Production**: Uses live keys and production database
   - **GitHub**: Uses placeholder values for public repository

   ### No Manual Configuration Required:

   The constants system handles all configuration automatically. You don't need to manually edit constants files.

5. ## Start the Development Server:
   1. **Create your `.env` file** with the variables listed above

   2. **Start the development server:**

   ```bash
   npm run dev
   ```

   This will launch the **POWERBACK.us** server and make it accessible at `http://localhost:3000`. 3. **Open your web browser** and navigate to `http://localhost:3000` to access your local instance of **POWERBACK.us**.

   ### Development Server Features:
   - **Hot reloading**: Changes to server code automatically restart the server
   - **Client development server**: React app runs on port 3000 with hot reloading
   - **API server**: Backend API runs on port 3001
   - **Background jobs**: Automated watchers for congressional data
   - **Environment variables**: Automatically loaded from `.env` file

   ### Available Development Commands:

   ```bash
   # Start development server
   npm run dev

   # Start production server locally
   npm run start:prod
   ```

   ### Running Tests:

   From the project root, `npm test` runs the full Jest suite (backend and client tests in one run; uses in-memory MongoDB via `test/setup.js`). See [NPM Scripts](./npm-scripts.md) for `test:watch`, `test:client`, `test:all`, and `test:coverage`. Testing strategy, Jest config, and API test conventions: [Testing Strategy](../specs/testing-strategy.md) and `.cursor/rules/11-testing.mdc`.

## Deploying to Production

For comprehensive production deployment with PM2, NGINX, and environment management, see the [Production Setup Guide](./production-setup.md).

For production deployment and environment management, see:

- [Production Setup Guide](./production-setup.md)

For FEC compliance and donor validation, see:

- [FEC Compliance Guide](./fec-compliance-guide.md)
- [Donor Validation System](./donor-validation-comprehensive.md)

For the end-to-end promotion flow from local to production with PM2, SSH, and artifact bundling, see the [Deployment Automation](./deployment-automation.md) guide.

## Making Contributions

If you plan to contribute to **POWERBACK.us**, follow our [Contribution Guidelines](../CONTRIBUTING.md). We appreciate your contributions and look forward to working together to make **POWERBACK.us** even better.

The [API Directory](./API.md) may be a good starting point to understand how the application works. For email functionality, see the [Email System Documentation](./email-system.md). For current dependency versions, see [Version Information](./version.md).

## Related Documentation

- [Project Overview](./overview.md) - Architecture and file structure
- [API Documentation](./API.md) - API endpoints
- [Authentication System](./authentication-system.md) - JWT authentication
- [Background Jobs](./background-jobs.md) - Automated monitoring
- [Payment Processing](./payment-processing.md) - Stripe integration
- [Environment Management](./environment-management.md) - Environment configuration
- [NPM Scripts](./npm-scripts.md) - Available npm commands (including test scripts)
- [Testing Strategy](../specs/testing-strategy.md) - Jest config, test setup, API test mocks and conventions
- [Linting & Formatting](./linting-formatting.md) - Code style guidelines

## Questions and Support

If you have any questions or need support during the development process, feel free to reach out to us on our [GitHub repository](https://github.com/powerbackus/powerback) or by email at [support@powerback.us](mailto:support@powerback.us). We're here to assist you.

Thank you for contributing to **POWERBACK.us** and being a part of our mission.

Happy coding!
The **POWERBACK.us** Team
