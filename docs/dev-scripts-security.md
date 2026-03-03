# Dev Scripts Security

## Overview
This document outlines the security measures in place for the dev scripts and routes.

> **📖 Related Documentation:**
> - [Development Guide](./development.md) - Development setup
> - [Production Setup](./production-setup.md) - Production security
> - [Environment Management](./environment-management.md) - Environment configuration

## File Permissions
- `dev/` directory: `700` (only fc user can access)
- `dev/*.js` files: `600` (only fc user can read/write)

## Environment Variables Required
- `NODE_ENV=production` - Must be set for production
- `ADMIN_KEY` - Required for dev scripts in production
- `ALLOW_DEV_SCRIPTS=true` - Required for dev scripts in production

## API Route Security
- **Production Block**: Routes disabled in production
- **Authentication**: Must be logged in
- **Admin Check**: Must be in admin list (`constants/admin.js`)
- **IP Restriction**: Only accessible from localhost
- **Self-Only**: Can only seed/clear your own data

## Usage in Production
```bash
# Set required environment variables
export NODE_ENV=production
export ADMIN_KEY="your-secret-key"
export ALLOW_DEV_SCRIPTS=true

# Run dev scripts as fc user
sudo -u fc node /home/fc/nodejsapp/dev/grant-admin.js <userId>
sudo -u fc node /home/fc/nodejsapp/dev/seed-fake-celebrations.js <userId> 25
```

## Security Layers
1. **File Permissions**: Only fc user can access scripts
2. **Environment Variables**: Multiple required flags
3. **Admin List**: Code-based admin verification
4. **IP Restrictions**: Localhost only for API routes
5. **Production Blocks**: Multiple environment checks
6. **Authentication**: Login required for API routes

## Admin Management
- Add user IDs to `constants/admin.js`
- Restart server after changes
- Use `dev/grant-admin.js` to get user details
