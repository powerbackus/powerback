# Deployment Automation (CI/CD Pipeline)

This pipeline provides a mostly hands-off, repeatable deployment from local development to production server.

### Prerequisites

- SSH access to the production server with key-based auth
- `dev/deploy.remote.sh` hosted on the server at the path in `dev/deploy.config.json`
- Non-destructive tests are separated from destructive tests (tag `@destructive` in Playwright; keep destructive suites out of `__tests__/` or match `ignorePatterns`)
- Current dependency versions as specified in [Version Information](./version.md)

### Configuration

- Edit `dev/deploy.config.json`:
  - `server.host`, `server.user`, `server.remoteAppDir`, `server.sshKeyPath`
  - `build.env.API_BASEURL` set to production API URL
  - Set `modes.codeEditsForProd` to `false` to avoid code changes; prefer env-driven behavior

### Environmental Switches (preferred)

- Client API base URL: `API_BASEURL`
- Stripe publishable key: Loaded at runtime from `/api/config/stripe-key` endpoint (uses `STRIPE_PK_LIVE` or `STRIPE_PK_TEST` based on `NODE_ENV`)
- Avoid hard-coding prod URLs/keys in `client/src/api/API.ts`. For secret keys, never bundle into the client. Use environment variables instead.

### Run

```bash
powershell -ExecutionPolicy Bypass -File dev/deploy.ps1 -ConfigPath dev/deploy.config.json
```

### What the script does

1. Verifies clean git working directory
2. Runs non-destructive tests (Jest; optional Playwright)
3. Creates a temporary release branch via worktree, commits, pushes, cleans up
4. Builds `client` with production env variables
   - Automatically runs `scripts/build/build-faq.js` via prebuild hook to generate FAQ JSON-LD schema and markdown docs
5. Packages artifacts (client and backend subset)
6. Uploads zips to the server via scp
7. Runs remote helper to upsert build, sync backend, install deps, and restart the app

### Destructive tests policy

- Tag destructive Playwright tests with `@destructive`
- Keep destructive Jest suites out of default patterns or configure `ignorePatterns` in `dev/deploy.config.json`

### Rollback

- Restart the app on the server (e.g. `sudo systemctl restart powerback.service`) to pick up a previous build.
- Git-level rollback is manual. Consider keeping `releases/` with timestamped bundles in future refinement.

### Future Enhancements

- Optional GitHub PR creation and checks gating
- Release artifact retention on the server under `/var/www/powerback-beta/releases/`
- Hash-based cache busting checks and integrity verification

## Related Documentation

- [Production Setup](./production-setup.md) - Production server setup
- [Environment Management](./environment-management.md) - Environment configuration
- [Version Information](./version.md) - Dependency versions
- [Development Guide](./development.md) - Development setup
