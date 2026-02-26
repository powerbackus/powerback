# Time To Take The POWERBACK

**POWERBACK.us** is an innovative platform that empowers small-dollar donors to make a real impact on democracy by aligning politicians with their campaign's values. This README provides an overview of **POWERBACK.us**, how it works, and how you can contribute.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./client/public/favicon-48.png">
  <source media="(prefers-color-scheme: light)" srcset="./client/public/logo192-dark.png">
  <img alt="Shows a simple graphic of a power cable turned backwards on itself, in different shades depending on user visual settings" src="./client/public/favicon-48.png">
</picture>

## Table of Contents

- [Introduction](#introduction)
- [How POWERBACK Works](#how-powerback-works)
- [Demo vs Production](#demo-vs-production)
- [Our Values](#our-values)
- [Contributing](#contributing)
- [License](#license)

## Introduction

**POWERBACK.us** draws inspiration from the `#ForceTheVote` movement of 2021, which challenged members of Congress to demand a vote on `Medicare For All`. This platform takes the concept further, allowing users to harness their collective power to promote accountability from our representatives.

**POWERBACK.us** is a digital revolution for wherever political corruption has become the new normal. We are not and will never be affiliated with any political party or individual candidate. Instead, **POWERBACK.us** focuses on serving voters, citizens, and regular people like you who just want their voices heard.

![The "candidate carousel" where users browse all eligible House incumbents.](https://github.com/user-attachments/assets/1cbbc470-ca80-4cf1-b765-ec35d46f9cb5)

## How POWERBACK Works

**POWERBACK.us's** operation is simple yet impactful:

1. Search for House `Representatives` who matter to you.

2. Create a `Celebration` agreement. This agreement means that **POWERBACK.us** commits to deliver your prepaid campaign donation on your behalf, to the House congressional candidate of your choice, if _and_ when the [We The People Amendment](https://www.congress.gov/bill/119th-congress/house-joint-resolution/54) to overturn `Citizens United` **is brought to the House floor for a vote**.

3. Choose your campaign donation amount, and proceed with payment. For larger amounts, **POWERBACK.us** takes care of proper filing with the [FEC](https://www.fec.gov/introduction-campaign-finance/how-to-research-public-records/individual-contributions/). (Learn more at our [FAQ](./docs/FAQ.md))

4. Your voice is heard, and you contribute to the cause you care about.

- You must be `18 years old` to donate. Read more at the [Eligibility requirements](./docs/eligibility.md).

### Demo vs Production

The **demo** experience uses fake totals, no authentication, and no real payment—it is for trying the flow and UI. **Production** is a conduit for real political donations: it requires auth, processes payments, and enforces eligibility and FEC compliance constraints.

## Our Values

- **Party Free:** **POWERBACK.us** will forever be nonpartisan, weaved into its very design of how information is presented.

- **Your Data:** Your peace and privacy is our top priority. **POWERBACK.us** will never sell or unilaterally share your identifying data with anyone or anything outside of our network.

- **Low Fees:** Our fees are the lowest out there, ensuring that democracy doesn't require paying a premium. Virtually all fees are to cover the payment processing service, [Stripe](https://stripe.com/). Learn more about these fees at the [FAQ](./docs/FAQ.md).

- **No Profits:** This is not a for-profit organization. **POWERBACK.us** relies on user and public support to continue our mission. You can make a difference by:
  - Giving a Tip along with your `Celebrations`
  - Supporting us on [Patreon](https://www.patreon.com/powerback)
  - Contributing Bitcoin: `bc1q7ymx62q8un9rptlc570sdg258e2wl8u0swjcps`
  - Joining our [Discord](https://powerback.us/discord) community
  - Contributing code on [GitHub](https://github.com/powerbackus/powerback)

## Contributing

**POWERBACK.us** welcomes contributions from the open-source community to help improve the application. We are ambitious to grow beyond this single issue in the House to include **all** elections and **all** legislation at **all** levels of government.

### Quick Start for Developers

1. **Clone the Repository**

   ```bash
   git clone https://github.com/powerbackus/powerback.git
   cd powerback
   ```

2. **Set Up Your Environment**
   - Follow the [Development Setup Guide](./docs/development.md)
   - Install dependencies: `npm install`
   - Configure environment variables (see [Environment Management](./docs/environment-management.md))

3. **Acquire API Keys**
   - Free API keys required for development
   - See [API Key Guide](./docs/keylist.md) for setup instructions
   - Keys typically approved instantly

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Resources for Contributors

- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute
- **[Project Overview](./docs/overview.md)** - Architecture and structure
- **[Coding Idiosyncrasies](./docs/coding-idiosyncrasies.md)** - Project-specific patterns
- **[Development Guide](./docs/development.md)** - Complete setup instructions

## Learn More

- **📄 [Position paper](https://powerback.us/position-paper.pdf)** - Technical and legal framework
- **📚 [Documentation Index](./docs/README.md)** - Complete documentation navigation
- **❓ [FAQ](./docs/FAQ.md)** - Frequently asked questions
- **⚖️ [Eligibility Requirements](./docs/eligibility.md)** - Donation eligibility

## Connect With Us

- **🐦 [X](https://x.com/PowerbackApp)** - Updates and announcements
- **💬 [Discord](https://powerback.us/discord)** - Community and discussions
- **💝 [Patreon](https://www.patreon.com/powerback)** - Support our mission

## Documentation

### Getting Started

- **[Development Setup](./docs/development.md)** - Set up your local development environment
- **[Project Overview](./docs/overview.md)** - Architecture and file structure
- **[API Documentation](./docs/API.md)** - Frontend ↔ backend API endpoints
- **[API Keys Guide](./docs/keylist.md)** - Required API keys and setup

### Core Systems

- **[Authentication System](./docs/authentication-system.md)** - JWT authentication and security
- **[FEC Compliance Guide](./docs/fec-compliance-guide.md)** - Compliance tiers and limits
- **[Donation Limits](./docs/donation-limits.md)** - Annual and election cycle resets
- **[Donor Validation](./docs/donor-validation-comprehensive.md)** - FEC "best efforts" validation

### Payment & Processing

- **[Payment Processing](./docs/payment-processing.md)** - Stripe integration and escrow system
- **[Webhook System](./docs/webhooks.md)** - Real-time payment event processing
- **[Bitcoin Donations](./docs/bitcoin-donations.md)** - Cryptocurrency donation support

### Celebration Lifecycle

- **[Status Ledger System](./docs/status-ledger-system.md)** - Celebration status tracking
- **[Defunct Celebrations](./docs/defunct-celebrations-system.md)** - Session end handling

### Background Jobs

- **[Background Jobs](./docs/background-jobs.md)** - Automated watchers and monitoring
- **[Election Date Notifications](./docs/election-dates.md)** - Election date change alerts

### Frontend Architecture

- **[React Contexts](./docs/contexts.md)** - Global state management
- **[Custom Hooks](./docs/hooks.md)** - Reusable React hooks catalog
- **[Design System](./docs/design-system.md)** - UI components and styling
- **[Props System](./docs/props.md)** - Centralized props type system

### Communication

- **[Email System](./docs/email-system.md)** - Email templates and notifications
- **[Link Tracking](./docs/link-tracking.md)** - Email link tracking system

### Deployment & Operations

- **[Deployment Automation](./docs/deployment-automation.md)** - CI/CD pipeline and automated deployment
- **[Production Setup](./docs/production-setup.md)** - Production server setup and configuration
- **[Environment Management](./docs/environment-management.md)** - Environment configuration
- **[Version Information](./docs/version.md)** - Dependency versions

### Development Tools

- **[NPM Scripts](./docs/npm-scripts.md)** - Available npm commands
- **[Linting & Formatting](./docs/linting-formatting.md)** - Code style guidelines
- **[Git Worktree Guide](./docs/git-worktree-guide.md)** - Git workflow utilities
- **[Coding Idiosyncrasies](./docs/coding-idiosyncrasies.md)** - Project-specific patterns

### Database Setup

- **[Local MongoDB Setup](./docs/local-mongodb-setup.md)** - Local database installation
- **[Remote MongoDB Setup](./docs/remote-mongodb-setup.md)** - Remote database configuration

If you'd like to contribute to the development of **POWERBACK.us**, please see the [Contributing Guidelines](./CONTRIBUTING.md).

## License

This project is licensed under the [GPL License](https://www.gnu.org/licenses/gpl-faq.html) - see the [LICENSE](./LICENSE) file for details.
