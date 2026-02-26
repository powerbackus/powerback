# Spec: Project Architecture & System Design

## Purpose
Define the comprehensive architecture, system design, and integration patterns for the Powerback platform based on codebase analysis.

## Scope
- In-scope: System architecture, component design, data flow, integration patterns, technology stack
- Out-of-scope: Third-party service internals, deployment infrastructure details

## System Overview

### Architecture Pattern
**Monorepo with Clear Client/Server Separation**
- **Frontend**: React/TypeScript SPA with component-based architecture
- **Backend**: Node.js/Express with service-oriented architecture
- **Database**: MongoDB with Mongoose ODM
- **Integration**: RESTful APIs with JWT authentication

### Core Domains
1. **User Management**: Authentication, authorization, profile management
2. **Political Data**: Congressional information, bills, politicians, districts
3. **Donation Processing**: FEC compliance, payment processing, escrow management
4. **Compliance**: Two-tier FEC compliance (guest/compliant)
5. **Communication**: Email notifications, alerts, user messaging

## Frontend Architecture

### Component Hierarchy
```
App/
├── Navigation/           # Top navigation and side panel
├── Page/                # Main page content router
│   ├── Splash/          # Landing page
│   ├── Celebrate/       # Donation flow
│   ├── Account/         # User management
│   └── Search/          # Political data search
├── Footer/              # Site footer
└── Modals/              # Overlay dialogs
    ├── Eligibility/     # Legal compliance
    ├── FAQ/            # Help and information
    └── Terms/          # Legal terms
```

### State Management
- **React Context**: Global state for auth, compliance, device, navigation
- **Local State**: Component-specific state with useState/useReducer
- **Form State**: Controlled components with validation
- **API State**: Loading, error, and success states

### Navigation Architecture
- **Unified NavigationContext**: Single context manages both splash and funnel navigation
- **Guest Access Control**: Session storage flags for legitimate guest access tracking
- **Browser History Sync**: Automatic synchronization with browser history API
- **Popstate Guards**: Block unauthorized browser back navigation from splash to funnel
- **State Cleanup**: Guest access flags cleared on login/logout to prevent stale access

### Code Organization
- **Feature-based**: Components grouped by feature/domain
- **Shared components**: Reusable UI components in dedicated folders
- **Hooks**: Custom hooks for business logic and API calls (including `usePaymentProcessing`)
- **Constants**: Centralized configuration and copy text
- **Types**: TypeScript interfaces and type definitions

## Backend Architecture

### Service Layer
```
services/
├── authentication/       # User authentication and authorization
├── congressional/        # Political data integration
├── payment/             # Stripe integration and processing
├── compliance/          # FEC compliance checking
├── notification/        # Email and SMS services
├── background/          # Job processing and scheduling
└── data/                # Database operations and caching
```

### Controller Layer
```
controller/
├── users/               # User account management
├── payments/            # Payment processing
├── celebrations/        # Donation events
├── congress/            # Political data
├── communications/      # Email and notifications
└── system/              # System operations
```

### Data Layer
```
models/
├── User.js              # User accounts and profiles
├── Celebration.js       # Donation events
├── Bill.js              # Congressional bills
├── Pol.js               # Politicians and candidates
└── Key.js               # API keys and credentials
```

## Integration Patterns

### API Design
- **RESTful**: Standard HTTP methods and status codes
- **Validation**: Joi schemas for all inputs
- **Authentication**: JWT tokens with HTTP-only cookies
- **Rate Limiting**: API-level rate limiting for security
- **Error Handling**: Consistent error response format

### External Services
- **Stripe**: Payment processing and webhooks with performance optimizations
- **Congress.gov**: Congressional data and bills
- **OpenFEC**: Federal election commission data
- **Email Services**: SMTP for notifications
- **SMS Services**: Text message notifications

### Background Jobs
- **Election Updates**: Real-time election date changes
- **Congressional Watchers**: Bill and politician updates
- **Data Snapshots**: Local caching of external data
- **Notification Processing**: Email and SMS delivery

## Data Flow Patterns

### User Authentication Flow
```
1. User submits credentials via /api/users/login
2. Passport.js validates credentials using local strategy
3. JWT access token generated for immediate use
4. JWT refresh token generated and stored in HTTP-only cookie
5. Refresh token saved to in-memory token store
6. User data and access token returned to frontend
7. Frontend AuthContext manages authentication state
8. Protected routes become accessible via tokenizer.guard() middleware
```

### Donation Processing Flow
```
1. User selects candidate and amount
2. Frontend validates compliance limits
3. Backend validates FEC requirements
4. Stripe payment intent created
5. Payment processed and confirmed
6. Celebration record created
7. User notified of success
```

### Data Synchronization Flow
```
1. Background jobs check external APIs
2. Changes detected and processed
3. Local snapshots updated
4. Database records modified
5. Affected users notified
6. Frontend data refreshed
```

## Technology Stack

### Frontend Technologies
- **React 18**: Component library with hooks
- **TypeScript**: Type-safe JavaScript
- **Bootstrap**: CSS framework for layout
- **Custom CSS**: Brand-specific styling
- **Webpack**: Module bundling and optimization

### Backend Technologies
- **Node.js**: JavaScript runtime
- **Express**: Web application framework
- **MongoDB**: Document database
- **Mongoose**: MongoDB object modeling
- **Passport.js**: Authentication middleware
- **Joi**: Data validation library

### Development Tools
- **ESLint**: Code quality enforcement
- **Jest**: Testing framework
- **Nodemon**: Development server
- **PM2**: Process management
- **Git**: Version control

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **HTTP-only Cookies**: XSS protection for tokens
- **Role-based Access**: Privilege-based authorization
- **Session Management**: Secure session handling
- **Password Security**: Bcrypt hashing and validation

### Data Protection
- **Input Validation**: Joi schemas for all inputs
- **SQL Injection Protection**: Mongoose ODM protection
- **XSS Prevention**: Content Security Policy headers
- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: API abuse prevention

### Compliance & Privacy
- **FEC Compliance**: Federal election commission requirements
- **Data Minimization**: Only collect necessary information
- **Audit Trails**: Complete transaction logging
- **Privacy Controls**: User data management
- **Legal Compliance**: Regulatory requirement adherence

## Performance & Scalability

### Frontend Optimization
- **Code Splitting**: Route-level and component-level lazy loading
- **Bundle Optimization**: Webpack optimization and tree shaking
- **Image Optimization**: WebP format and responsive images
- **Caching Strategy**: Service worker and browser caching
- **Performance Monitoring**: Core Web Vitals tracking

### Backend Optimization
- **Database Indexing**: Optimized query performance
- **Caching Strategy**: Redis and in-memory caching
- **Connection Pooling**: Database connection management
- **Load Balancing**: Horizontal scaling support
- **Monitoring**: Performance metrics and alerting
- **Webhook Optimization**: Skip processing for users at PAC limits to reduce database load

## Development Workflow

### Code Quality Standards
- **ESLint**: Automated code quality enforcement
- **TypeScript**: Compile-time error checking
- **Pre-commit Hooks**: Quality gates before commits
- **Code Review**: Peer review for all changes
- **Testing**: Unit, integration, and E2E tests

### Testing Strategy
- **Unit Tests**: Business logic and utilities
- **Integration Tests**: API endpoints and services
- **E2E Tests**: Critical user flows
- **Coverage Targets**: 80%+ for critical paths
- **Automated Testing**: CI/CD pipeline integration

### Deployment Process
- **Environment Management**: Development, staging, production
- **Process Management**: Systemd for Node.js processes
- **Health Checks**: Service availability monitoring
- **Rollback Strategy**: Quick rollback for issues
- **Monitoring**: Application and infrastructure monitoring
- **Security**: Secure secret management with temporary file loading

## Links
- Rules: 31-project-architecture, 07-frontend-patterns, 12-http-and-api-usage
- Specs: specs/backend-compliance.md, specs/frontend-ui.md, specs/quality-assessment.md
- Code: `app.js`, `client/src/App.tsx`, `services/`, `routes/api/`
