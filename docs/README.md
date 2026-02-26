# POWERBACK.us Documentation Index

This directory contains comprehensive documentation for the POWERBACK.us platform. This index provides a logical navigation path through all documentation, organized by topic and use case.

## Getting Started

**New to POWERBACK.us?** Start here:

1. **[Development Setup](./development.md)** - Set up your local development environment
2. **[Project Overview](./overview.md)** - Understand the architecture and file structure
3. **[API Documentation](./API.md)** - Learn the frontend ↔ backend API endpoints
4. **[Coding Idiosyncrasies](./coding-idiosyncrasies.md)** - Understand project-specific patterns

## 📚 Documentation by Category

### Core Systems

#### Authentication & Security

- **[Authentication System](./authentication-system.md)** - JWT authentication, token management, security patterns
- **[API Documentation](./API.md)** - All API endpoints with authentication details

#### Payment Processing

- **[Payment Processing](./payment-processing.md)** - Stripe integration, escrow system, payment flow
- **[Webhook System](./webhooks.md)** - Real-time payment event processing
- **[Bitcoin Donations](./bitcoin-donations.md)** - Cryptocurrency donation support

#### FEC Compliance

- **[FEC Compliance Guide](./fec-compliance-guide.md)** - Comprehensive FEC compliance requirements
- **[Donation Limits](./donation-limits.md)** - Annual and election cycle resets
- **[Donor Validation](./donor-validation-comprehensive.md)** - FEC "best efforts" validation system

### Celebration Lifecycle

- **[Status Ledger System](./status-ledger-system.md)** - Celebration status tracking and audit trail
- **[Defunct Celebrations System](./defunct-celebrations-system.md)** - Session end handling and conversion
- Celebration status values are defined in `shared/celebrationStatus.js`; backend and client import from there (see Status Ledger System).

### Background Jobs & Automation

- **[Background Jobs](./background-jobs.md)** - Automated watchers and monitoring system
- **[Social Announcements Webhooks](./social-announcements-webhooks.md)** - Watcher events to Make.com for social posts
- **[Election Date Notifications](./election-dates.md)** - Election date change alerts

### Frontend Architecture

- **[React Contexts](./contexts.md)** - Global state management system
- **[Custom Hooks](./hooks.md)** - Reusable React hooks catalog
- **[Common Props (type slices)](./common-props.md)** - Reusable prop slice types for components
- **[Design System](./design-system.md)** - UI components, styling, and design tokens
- **[Accessibility Guide](./accessibility.md)** - Accessibility features, standards, and contribution guidelines
- **[CSS Organization](./css-organization.md)** - CSS file structure
- **[CSS Important Usage](./css-important-usage.md)** - When and how to use !important

### Communication Systems

- **[Email System](./email-system.md)** - Email templates and notifications
- **[Link Tracking](./link-tracking.md)** - Email link tracking system

### Deployment & Operations

- **[Server Hardening](./server-hardening.md)** - VPS security, hardening, and operational procedures
- **[Deployment Automation](./deployment-automation.md)** - CI/CD pipeline and automated deployment
- **[Production Setup](./production-setup.md)** - Production server setup and configuration
- **[Environment Management](./environment-management.md)** - Environment configuration
- **[Production Commands](./production-commands.md)** - Production operation commands
- **[Demo Mode](./demo-mode.md)** - Guest-only demo experience setup and configuration

### Database Setup

- **[Local MongoDB Setup](./local-mongodb-setup.md)** - Local database installation (includes Ubuntu 24.04 instructions)
- **[Remote MongoDB Setup](./remote-mongodb-setup.md)** - Remote database configuration

### Development Tools

- **[NPM Scripts](./npm-scripts.md)** - Available npm commands
- **[Linting & Formatting](./linting-formatting.md)** - Code style guidelines
- **[Git Worktree Guide](./git-worktree-guide.md)** - Git workflow utilities
- **[Version Information](./version.md)** - Dependency versions

### User-Facing Documentation

- **[FAQ](./FAQ.md)** - Frequently asked questions
- **[Eligibility Requirements](./eligibility.md)** - Donation eligibility

### Reference Documentation

- **[API Key List](./keylist.md)** - Required API keys and setup
- **[CHANGELOG](./CHANGELOG.md)** - Project changelog
- **[Codebase Evaluation Prompts](./codebase-evaluation-prompts.md)** - Evaluation framework
- **[Coding Idiosyncrasies](./coding-idiosyncrasies.md)** - Project-specific patterns
- **[Dev Scripts Security](./dev-scripts-security.md)** - Development script security
- **[Deployment Persistent Data Analysis](./deployment-persistent-data-analysis.md)** - Data persistence strategy

## 🔗 Quick Links by Use Case

### I want to...

**...set up a development environment**
→ [Development Setup](./development.md) → [API Keys](./keylist.md) → [Local MongoDB](./local-mongodb-setup.md)

**...understand how payments work**
→ [Payment Processing](./payment-processing.md) → [Webhooks](./webhooks.md) → [FEC Compliance](./fec-compliance-guide.md)

**...learn about the frontend architecture**
→ [Project Overview](./overview.md) → [React Contexts](./contexts.md) → [Custom Hooks](./hooks.md) → [Design System](./design-system.md) → [Accessibility](./accessibility.md)

**...understand compliance and limits**
→ [FEC Compliance Guide](./fec-compliance-guide.md) → [Donation Limits](./donation-limits.md) → [Donor Validation](./donor-validation-comprehensive.md)

**...deploy to production**
→ [Production Setup](./production-setup.md) → [Server Hardening](./server-hardening.md) → [Deployment Automation](./deployment-automation.md) → [Environment Management](./environment-management.md) → [Demo Mode](./demo-mode.md)

**...understand background jobs**
→ [Background Jobs](./background-jobs.md) → [Election Dates](./election-dates.md) → [Defunct Celebrations](./defunct-celebrations-system.md)

**...contribute code**
→ [Development Setup](./development.md) → [Coding Idiosyncrasies](./coding-idiosyncrasies.md) → [Linting & Formatting](./linting-formatting.md)

**...improve accessibility**
→ [Accessibility Guide](./accessibility.md) → [Design System](./design-system.md) → [Frontend UI Spec](../specs/frontend-ui.md)

## 📖 External Resources

- **Position paper**: [/position-paper.pdf](https://powerback.us/position-paper.pdf) - Technical and legal framework
- **GitHub**: [github.com/powerbackus/powerback](https://github.com/powerbackus/powerback) - Source code
- **X (Twitter)**: [@PowerbackApp](https://x.com/PowerbackApp) - Updates
- **Discord**: [powerback.us/discord](https://powerback.us/discord) - Community
- **Patreon**: [patreon.com/powerback](https://www.patreon.com/powerback) - Support

## 🔄 Documentation Maintenance

This documentation is actively maintained. If you find:

- Broken links
- Outdated information
- Missing documentation
- Inaccuracies

Please open an issue on [GitHub](https://github.com/powerbackus/powerback) or contact [support@powerback.us](mailto:support@powerback.us).

---
