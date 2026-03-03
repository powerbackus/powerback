# Spec: JWT Authentication System

## Purpose
Define the JWT-based authentication system architecture, security patterns, and implementation guidelines for secure user authentication and session management.

## Scope
- In-scope: JWT token management, HTTP-only cookies, session persistence, account security, middleware patterns
- Out-of-scope: Third-party authentication providers, OAuth flows, social login

## Requirements
- JWT-only authentication system with no session-based authentication
- HTTP-only cookies for secure token storage
- Automatic token refresh with rotation
- Account lock triggers automatic logout
- User identification via JWT payload subject field
- Comprehensive security logging and monitoring

## System Architecture

### Core Components
- **`auth/authbase.js`**: Base authentication class with JWT token management
- **`auth/tokenizer.js`**: Concrete implementation extending AuthBase
- **`auth/tokenStore.js`**: In-memory token store for refresh tokens
- **`routes/api/users.js`**: User authentication endpoints
- **`controller/users/password/change.js`**: Password change with token invalidation

### Authentication Flow
```
1. User submits credentials via /api/users/login
2. Server validates credentials directly
3. JWT access token generated for immediate use
4. JWT refresh token generated and stored in HTTP-only cookie
5. Refresh token saved to in-memory token store
6. User data and access token returned to frontend
```

### Token Refresh Flow
```
1. Frontend calls /api/users/refresh with HTTP-only cookie
2. Server validates refresh token from cookie
3. Checks token exists in token store and is not expired
4. Validates token version matches user's current version
5. Generates new access token and refresh token
6. Invalidates old refresh token (single-use security)
7. Sets new refresh token in HTTP-only cookie
8. Returns new access token and user data
```

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

### Account Security
- **Account Lock Logout**: Automatic logout when accounts are locked due to failed password resets
- **Token Invalidation**: All tokens invalidated on password change
- **Session Destruction**: Other user sessions destroyed for security

## Technical Implementation

### JWT Token Structure
```javascript
// Access Token Payload
{
  "sub": "user_id",           // User identifier
  "aud": "us.powerback.authenticated-users",
  "iss": "https://powerback.us",
  "jti": "token_id",          // JWT ID for token tracking
  "exp": 1234567890,          // Expiration timestamp
  "iat": 1234567890           // Issued at timestamp
}

// Refresh Token Payload
{
  "sub": "user_id",
  "aud": "us.powerback.authenticated-users", 
  "iss": "https://powerback.us",
  "jti": "token_id",
  "exp": 1234567890,
  "iat": 1234567890,
  "user": {
    "_id": "user_id",
    "tokenVersion": 1
  }
}
```

### Cookie Configuration
```javascript
// Production cookie settings
{
  expires: new Date(Date.now() + SERVER.REFRESH_EXPY * 1000),
  domain: process.env.COOKIE_DOMAIN
  path: '/api/users/refresh',
  sameSite: 'strict',
  httpOnly: true,
  secure: true,
}

// Development cookie settings
{
  expires: new Date(Date.now() + SERVER.REFRESH_EXPY * 1000),
  path: '/api/users/refresh',
  domain: 'localhost'
  sameSite: 'strict',
  httpOnly: true,
  secure: false,
}
```

### Middleware Patterns
```javascript
// Route Protection
router.get('/protected', tokenizer.guard(), (req, res) => {
  // req.jwt.payload.sub contains user ID
  const userId = req.jwt.payload.sub;
  // Handle protected route logic
});

// Resource Ownership Guard
router.get('/data/:userId', tokenizer.guard(), guardOwnership(), (req, res) => {
  // User can only access their own data
  // guardOwnership() checks req.jwt.payload.sub === req.params.userId
});
```

## API Endpoints

### Authentication Endpoints

#### `POST /api/users/login`
- **Purpose**: User authentication and session creation
- **Input**: `{ username, password }`
- **Output**: User data and access token
- **Cookies**: Sets HTTP-only refresh token cookie
- **Rate Limiting**: `loginLimiter` (5 attempts per 15 minutes)

#### `GET /api/users/refresh`
- **Purpose**: Token refresh using HTTP-only cookie
- **Input**: Refresh token from HTTP-only cookie
- **Output**: New access token and user data
- **Cookies**: Updates refresh token cookie with new token
- **Rate Limiting**: `refreshLimiter` (10 attempts per 15 minutes)

#### `GET /api/users/logout`
- **Purpose**: Session termination and cleanup
- **Input**: None (uses existing session)
- **Output**: Success confirmation
- **Cookies**: Clears refresh token cookie
- **Authentication**: Requires valid JWT token

#### `PUT /api/users/change/:userId`
- **Purpose**: Password change with token invalidation
- **Input**: `{ newPassword }`
- **Output**: Success message and new access token
- **Security**: Invalidates all existing tokens, destroys other sessions
- **Rate Limiting**: `passwordChangeLimiter` (3 attempts per 15 minutes)

## Error Handling

### Authentication Errors
- **401 Unauthorized**: Invalid or expired tokens
- **403 Forbidden**: Insufficient permissions
- **422 Unprocessable Entity**: Invalid input data
- **500 Internal Server Error**: Server-side errors

### Token Validation Errors
- **Invalid Token**: Returns 401 Unauthorized
- **Expired Token**: Clears cookies and logs out user
- **Missing Token**: Returns 401 Unauthorized
- **Token Version Mismatch**: Returns 401 Unauthorized

### Account Security Errors
- **Account Locked**: Automatic logout with cookie clearing
- **Password Change**: All tokens invalidated, new tokens generated
- **Session Expired**: Graceful redirect to login

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

## Integration Patterns

### Frontend Integration
- **AuthContext**: Manages authentication state and token refresh
- **API Calls**: Automatic token refresh on 401 errors
- **Session Persistence**: HTTP-only cookies maintain sessions across page refreshes

### Backend Integration
- **Route Protection**: `tokenizer.guard()` middleware protects routes
- **User Context**: Authenticated user available in `req.jwt.payload.sub`
- **Token Validation**: Automatic token validation on protected routes
- **Resource Ownership**: `guardOwnership()` middleware for user-specific resources

## Monitoring and Logging

### Security Logging
```javascript
// Token validation logging
logger.debug('Authorization successful', { url: req.originalUrl });

// Token rejection logging
logger.debug('Token rejection', {
  error: error.message,
  errorType: error.constructor.name,
  url: req.originalUrl,
});

// Password change logging
logger.info('User changed password', {
  action: 'change_password',
  userId: req.params.userId,
  ip: req.ip,
});
```

### Performance Monitoring
- **Token Store Size**: Monitor in-memory token store size
- **Cleanup Operations**: Track token cleanup effectiveness
- **Authentication Timing**: Monitor authentication request performance
- **Error Rates**: Track authentication failure rates

## Testing Requirements

### Unit Tests
- **Token Generation**: Test JWT token creation and validation
- **Token Store**: Test in-memory token store operations
- **Password Change**: Test token invalidation on password change
- **Error Handling**: Test authentication error scenarios

### Integration Tests
- **Authentication Flow**: Test complete login/logout flow
- **Token Refresh**: Test token refresh functionality
- **Route Protection**: Test protected route access
- **Session Management**: Test session persistence and cleanup

### Security Tests
- **XSS Prevention**: Test HTTP-only cookie security
- **CSRF Protection**: Test SameSite cookie protection
- **Token Rotation**: Test single-use token security
- **Session Invalidation**: Test password change security

## Performance Considerations

### Memory Management
- **Token Store Cleanup**: Hourly cleanup of expired tokens
- **Memory Monitoring**: Track token store size and growth
- **Garbage Collection**: Ensure proper cleanup of invalidated tokens

### Database Optimization
- **User Lookups**: Optimize user queries for authentication
- **Session Storage**: Efficient session data management
- **Token Validation**: Minimize database queries for token validation

## Compliance Requirements

### FEC Compliance
- **Audit Trails**: Complete authentication event logging
- **Data Security**: Secure handling of user authentication data
- **Access Control**: Proper authorization for all protected resources

### Privacy Requirements
- **Data Minimization**: Only collect necessary authentication data
- **Secure Storage**: Proper handling of authentication tokens
- **User Rights**: Support for user data access and deletion

## Acceptance Criteria

### Functional Requirements
- JWT-only authentication system working correctly
- HTTP-only cookies secure and functional
- Token refresh working with rotation
- Account lock triggers automatic logout
- User identification via JWT payload subject

### Security Requirements
- No XSS vulnerabilities in token storage
- CSRF protection via SameSite cookies
- Token rotation working correctly
- Session invalidation on password change
- Comprehensive security logging

### Performance Requirements
- Token validation under 100ms
- Memory usage stable with cleanup
- Database queries optimized
- Error handling graceful and secure

## Links
- Rules: 22-auth-and-tokens, 44-authentication-system, 03-backend-authority-and-compliance
- Code: `auth/`, `routes/api/users.js`, `controller/users/password/change.js`
- Docs: `docs/authentication-system.md`, `docs/API.md`
- Related: specs/backend-compliance.md, specs/project-architecture.md
