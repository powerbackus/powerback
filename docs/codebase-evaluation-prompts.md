# Codebase Evaluation Prompts

This document contains optimized prompts for conducting comprehensive codebase evaluations of the POWERBACK project. These prompts are designed to be cost-effective while providing thorough analysis across different domains.

> **📖 Related Documentation:**
> - [Project Overview](./overview.md) - Architecture overview
> - [Development Guide](./development.md) - Development setup
> - [Quality Assessment](../specs/quality-assessment.md) - Quality standards

## Cost Optimization Strategy

**Approach**: Modular evaluations instead of one massive analysis
**Estimated Cost**: $0.25-0.40 per focused evaluation (vs $2.00-3.00+ for comprehensive)
**Total Cost**: $1.00-1.60 for complete evaluation across all domains

## Evaluation Domains

### 1. Security & Compliance Evaluation

**Estimated Cost**: $0.30-0.40

```
# Security & Compliance Codebase Evaluation

**Project**: POWERBACK - Political donation platform
**Scope**: Authentication, authorization, financial security, FEC compliance

**Evaluate ONLY**:
1. Authentication mechanisms (Passport.js, JWT, session management)
2. Input validation and sanitization (XSS, injection prevention)
3. Financial transaction security (Stripe integration, PCI compliance)
4. FEC compliance implementation (donation limits, reporting)
5. Data privacy and PII handling
6. Rate limiting and abuse prevention
7. CORS and CSRF protection
8. Environment variable and secrets management

**Deliverables**:
- Critical security findings (High/Medium/Low priority)
- Specific code examples with file paths and line numbers
- Actionable remediation steps with estimated effort
- Compliance gap analysis for FEC requirements

**Focus on**: Security vulnerabilities, compliance gaps, and financial transaction integrity
```

### 2. Architecture & Performance Evaluation

**Estimated Cost**: $0.30-0.40

```
# Architecture & Performance Codebase Evaluation

**Project**: POWERBACK - Political donation platform
**Scope**: System architecture, performance optimization, scalability

**Evaluate ONLY**:
1. Overall system architecture (monorepo structure, separation of concerns)
2. API design patterns (RESTful design, middleware organization)
3. Database optimization (MongoDB queries, indexing, relationships)
4. Frontend architecture (React component structure, state management)
5. Background job processing (node-cron, reliability)
6. Caching strategies and performance bottlenecks
7. Static asset serving and compression
8. Memory management and resource optimization

**Deliverables**:
- Architectural improvements and refactoring opportunities
- Performance bottlenecks with specific metrics
- Scalability recommendations
- Code organization suggestions

**Focus on**: Performance optimization, maintainability, and scalability
```

### 3. Frontend & UX Evaluation

**Estimated Cost**: $0.25-0.35

```
# Frontend & UX Codebase Evaluation

**Project**: POWERBACK - Political donation platform
**Scope**: React frontend, user experience, accessibility

**Evaluate ONLY**:
1. React component hierarchy and organization
2. State management patterns and data flow
3. Routing and navigation implementation
4. Accessibility compliance (WCAG guidelines)
5. Responsive design and mobile optimization
6. Bundle size optimization and loading performance
7. Error boundaries and graceful degradation
8. User interface consistency and design patterns

**Deliverables**:
- UX/UI improvements and accessibility fixes
- Component refactoring opportunities
- Performance optimization for frontend
- Mobile responsiveness issues

**Focus on**: User experience, accessibility, and frontend performance
```

### 4. Testing & Quality Assurance Evaluation

**Estimated Cost**: $0.25-0.35

```
# Testing & Quality Assurance Codebase Evaluation

**Project**: POWERBACK - Political donation platform
**Scope**: Test coverage, quality assurance, CI/CD

**Evaluate ONLY**:
1. Test coverage analysis (unit, integration, e2e)
2. Testing strategies and best practices
3. Mocking and test isolation patterns
4. CI/CD pipeline configuration
5. Linting and code formatting consistency
6. Error handling and edge case testing
7. Security testing implementation
8. Performance testing strategies

**Deliverables**:
- Test coverage gaps and improvement recommendations
- CI/CD pipeline enhancements
- Quality assurance process improvements
- Automated testing strategy

**Focus on**: Test coverage, quality assurance, and development workflow
```

## Usage Instructions

1. **Choose the appropriate domain** based on your current priorities
2. **Copy the prompt** and paste it into your AI assistant
3. **Use MAX Mode** to allow the AI to read your entire codebase
4. **Review the findings** and prioritize based on severity
5. **Implement fixes** starting with Critical and High priority items

## Priority Order

For political donation platforms, recommended evaluation order:

1. **Security & Compliance** (highest priority - financial/legal risks)
2. **Architecture & Performance** (user experience and scalability)
3. **Frontend & UX** (user engagement and accessibility)
4. **Testing & Quality Assurance** (long-term maintainability)

## Cost Tracking

- Track costs per evaluation domain
- Compare findings across domains for overlapping issues
- Use findings to prioritize development efforts
- Re-run evaluations after major changes

## Notes

- These prompts are optimized for GPT-4 Turbo in MAX Mode
- Adjust scope based on specific concerns or time constraints
- Consider running focused evaluations on specific features or components
- Update prompts based on project evolution and new requirements
