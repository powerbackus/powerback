# POWERBACK.us Version Information

This document tracks the current versions of major dependencies and development tools used in the POWERBACK.us project.

## Current Build Versions

### Core Runtime
- **Node.js**: v18.12.0 (recommended for development)
- **npm**: 9.x (package manager)
- **MongoDB**: 6.x (database)

### Frontend Stack
- **React**: 18.x (UI framework)
- **TypeScript**: 4.x (type system)
- **Bootstrap**: 5.x (CSS framework)
- **Webpack**: 5.x (bundler, via react-scripts)

### Backend Stack
- **Express**: 4.x (web framework)
- **Mongoose**: 7.x (MongoDB ODM)
- **Passport.js**: 0.6.x (authentication)
- **Joi**: 17.x (validation)

### Payment & External Services
- **Stripe**: Latest (payment processing)
- **Congress.gov API**: v3 (legislative data)
- **OpenFEC API**: v1 (campaign finance)
- **Google Civics API**: v2 (representative lookup)

### Development Tools
- **Jest**: 29.x (testing framework)
- **Playwright**: Latest (e2e testing)
- **ESLint**: 8.x (code quality)
- **Nodemon**: 3.x (dev server)

### Production Tools
- **PM2**: Latest (process manager)
- **MongoDB Atlas**: Cloud database hosting

## Environment Requirements

### Development Setup
- Node.js v18.12.0 or higher
- MongoDB instance (local or Atlas)
- Git for version control
- Modern web browser for testing

### Production Deployment
- Node.js v18.12.0+
- PM2 for process management
- SSH access to production server
- SSL certificates for HTTPS

## Version Update History

### Last Updated
- **Date**: January 2025
- **Updated by**: Development Team
- **Reason**: Documentation standardization and dependency audit

### Previous Updates
- Node.js upgraded to v18.12.0 for LTS support
- React 18 upgrade for improved performance
- TypeScript 4.x for enhanced type safety
- MongoDB 6.x for improved query performance

## Upgrade Considerations

### Breaking Changes
- Node.js v18+ requires updated native modules
- React 18 introduces new concurrent features
- MongoDB 6.x has deprecated some query operators

### Compatibility Notes
- All dependencies tested with Node.js v18.12.0
- Frontend builds require modern bundler support
- Backend APIs maintain backward compatibility

## Related Documentation

- [Development Setup Guide](./development.md) - Complete development environment setup
- [Deployment Automation](./deployment-automation.md) - Production deployment process
- [API Documentation](./API.md) - Backend API endpoints and integration
- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute to the project
- [NPM Scripts](./npm-scripts.md) - Available npm commands

## Support

For version-specific issues or upgrade questions:
- Check the [Development Setup Guide](./development.md)
- Review [API Documentation](./API.md) for integration details
- Contact support at [support@powerback.us](mailto:support@powerback.us)
