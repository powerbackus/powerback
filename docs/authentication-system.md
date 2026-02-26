# Authentication System Documentation

## Overview

The POWERBACK authentication system uses JWT (JSON Web Tokens) with HTTP-only cookies for secure token management. The system implements token rotation, secure cookie handling, and comprehensive session management.

## Architecture

### Core Components

- **`auth/authbase.js`** - Base authentication class with JWT token management
- **`auth/tokenizer.js`** - Concrete implementation extending AuthBase
- **`auth/tokenStore.js`** - In-memory token store for refresh tokens
- **`routes/api/users.js`** - User authentication endpoints
- **`controller/users/password/change.js`** - Password change with token invalidation

### Token Types

1. **Access Tokens** - Short-lived tokens for API authorization (configurable expiration)
2. **Refresh Tokens** - Long-lived tokens (18 days) stored in HTTP-only cookies for session persistence

## Authentication Flow

### Login Process

1. User submits credentials via `/api/users/login`
2. Server validates credentials directly (no Passport.js)
3. JWT access token generated for immediate use
4. JWT refresh token generated and stored in HTTP-only cookie
5. Refresh token saved to in-memory token store
6. User data and access token returned to frontend

### Token Refresh Process

1. Frontend calls `/api/users/refresh` with HTTP-only cookie
2. Server validates refresh token from cookie
3. Checks token exists in token store and is not expired
4. Validates token version matches user's current version
5. Generates new access token and refresh token
6. Invalidates old refresh token (single-use security)
7. Sets new refresh token in HTTP-only cookie
8. Returns new access token and user data

### Password Change Process

1. User changes password via `/api/users/change/:userId`
2. Password hashed and stored in database
3. Token version incremented to invalidate all existing tokens
4. All existing refresh tokens removed from token store
5. New JWT tokens generated with updated token version
6. All other user sessions destroyed for security
7. New refresh token set in HTTP-only cookie

## Security Features

### Token Security

- **HTTP-only Cookies**: Refresh tokens stored in HTTP-only cookies to prevent XSS attacks
- **Secure Cookies**: Production cookies marked as secure for HTTPS-only transmission
- **SameSite Protection**: Cookies set with appropriate SameSite attributes
- **Token Rotation**: Refresh tokens are single-use and rotated on each refresh
- **Token Versioning**: Tokens invalidated when password changes

### Session Management

- **In-Memory Store**: Refresh tokens stored in memory with expiration timestamps
- **Automatic Cleanup**: Expired tokens removed hourly to prevent memory bloat
- **Session Invalidation**: Password changes destroy all user sessions
- **Token Validation**: Comprehensive token validation including timing checks

### Error Handling

- **Token Rejection**: Invalid tokens trigger logout and cookie clearing
- **Graceful Degradation**: Authentication failures handled with appropriate HTTP status codes
- **Logging**: Comprehensive logging for security monitoring and debugging

## API Endpoints

### Authentication Endpoints

#### `POST /api/users/login`

- **Purpose**: User authentication and session creation
- **Input**: `{ username, password }`
- **Output**: User data and access token
- **Cookies**: Sets HTTP-only refresh token cookie

#### `GET /api/users/refresh`

- **Purpose**: Token refresh using HTTP-only cookie
- **Input**: Refresh token from HTTP-only cookie
- **Output**: New access token and user data
- **Cookies**: Updates refresh token cookie with new token

#### `GET /api/users/logout`

- **Purpose**: Session termination and cleanup
- **Input**: None (uses existing session)
- **Output**: Success confirmation
- **Cookies**: Clears refresh token cookie

#### `PUT /api/users/change/:userId`

- **Purpose**: Password change with token invalidation
- **Input**: `{ newPassword }`
- **Output**: Success message and new access token
- **Security**: Invalidates all existing tokens, destroys other sessions

## Token Store Management

### In-Memory Storage

```javascript
// Token store maps refresh tokens to expiration timestamps
const store = new Map(); // token → expiresAt (timestamp in ms)
```

### Token Lifecycle

1. **Creation**: Token saved with 18-day expiration
2. **Validation**: Token checked against store and expiration
3. **Rotation**: Old token deleted, new token created
4. **Cleanup**: Expired tokens removed hourly

### Memory Management

- **Automatic Cleanup**: Hourly cleanup of expired tokens
- **Memory Monitoring**: Logging of cleanup operations
- **Test Environment**: Cleanup disabled in test environment

## Cookie Configuration

### Production Settings

```javascript
{
  expires: new Date(Date.now() + SERVER.REFRESH_EXPY * 1000),
  sameSite: 'strict',
  path: '/api/users/refresh',
  secure: true,
  httpOnly: true
}
```

### Development Settings

```javascript
{
  expires: new Date(Date.now() + SERVER.REFRESH_EXPY * 1000),
  sameSite: 'strict',
  path: '/api/users/refresh',
  secure: false,
  httpOnly: true
}
```

## Error Handling

### Token Validation Errors

- **Invalid Token**: Returns 401 Unauthorized
- **Expired Token**: Clears cookies and logs out user
- **Missing Token**: Returns 401 Unauthorized
- **Token Version Mismatch**: Returns 401 Unauthorized

### Password Change Errors

- **Invalid Password**: Returns 422 Unprocessable Entity
- **User Not Found**: Returns 404 Not Found
- **Session Errors**: Logged and handled gracefully

## Security Considerations

### Token Security

- Refresh tokens are single-use and rotated on each refresh
- Tokens include token version for password change invalidation
- HTTP-only cookies prevent XSS attacks
- Secure cookies prevent transmission over HTTP in production

### Session Security

- Password changes invalidate all existing tokens
- Other user sessions destroyed on password change
- Token timing validation prevents replay attacks
- Comprehensive logging for security monitoring

### Error Security

- No sensitive information leaked in error messages
- Proper HTTP status codes for different error types
- Graceful handling of authentication failures
- Security events logged for monitoring
- Frontend auth flows (e.g. `AuthContext`, login/reset/activation pages) use the client logging helper (`logError` / `logWarn` from `@Utils`) so that browser consoles in production only see high-level messages; full error objects, responses, and stack traces are limited to development.

## Integration Points

### Frontend Integration

- **AuthContext**: Manages authentication state and token refresh
- **API Calls**: Automatic token refresh on 401 errors
- **Session Persistence**: HTTP-only cookies maintain sessions across page refreshes

### Backend Integration

- **Route Protection**: `tokenizer.guard()` middleware protects routes
- **User Context**: Authenticated user available in `req.jwt.payload.sub`
- **Token Validation**: Automatic token validation on protected routes
- **JWT-only System**: No session-based authentication, pure JWT tokens

## Monitoring and Logging

### Security Logging

- Authentication attempts and failures
- Token validation and rejection events
- Password change events and session destruction
- Security events and error conditions

### Performance Monitoring

- Token store size and cleanup operations
- Authentication request timing
- Memory usage and cleanup effectiveness
- Error rates and failure patterns

## Troubleshooting

### Common Issues

1. **Token Not Found**: Check token store and expiration
2. **Cookie Not Set**: Verify cookie configuration and domain settings
3. **Session Expired**: Check token version and password change history
4. **Authentication Failed**: Verify token signature and audience

### Debug Information

- Token store state and size
- Cookie configuration and values
- Token validation results
- Error messages and stack traces

## System Architecture

- **JWT-only Authentication**: Pure JWT token-based authentication system
- **HTTP-only Cookies**: Secure token storage with automatic refresh
- **Session Management**: In-memory token store with automatic cleanup
- **Account Security**: Automatic logout when accounts are locked due to failed password resets

## Related Documentation

- [API Documentation](./API.md) - API endpoints and authentication
- [Development Guide](./development.md) - Development setup
- [FEC Compliance Guide](./fec-compliance-guide.md) - Compliance system
- [User Management](./overview.md) - User model and management

## Links

- Code: `auth/`, `routes/api/users.js`, `controller/users/password/change.js`
- Related: `docs/API.md`, `specs/backend-compliance.md`, `specs/jwt-authentication-system.md`
- Documentation: See [`README.md`](../README.md) for complete documentation index
