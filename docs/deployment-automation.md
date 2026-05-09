# Deployment Automation

This document describes how application code is pushed from a developer machine to production. It complements [Production Setup](./production-setup.md) (server bootstrap, systemd, nginx) and [Production Commands](./production-commands.md) (`launch` for secrets-only restarts).

## Primary script: `scripts/deploy/deploy.remote.sh`

The repo ships a bash driver: **[`scripts/deploy/deploy.remote.sh`](../scripts/deploy/deploy.remote.sh)**.

### Prerequisites

- SSH key access to the production host as the deploy user (see `SSH_KEY` and `REMOTE_USER` in the script)
- Clean enough tree to pass `npm run lint` (the script enforces this)
- Current dependency versions as specified in [Version Information](./version.md)
- Non-destructive tests are separated from destructive tests (tag `@destructive` in Playwright; keep destructive suites out of default test runs where applicable)

### Configuration

Edit the **CONFIG** block at the top of `deploy.remote.sh`:

- `REMOTE_HOST`, `REMOTE_USER`, `SSH_KEY`
- `APP_ROOT` / `REMOTE_BACKEND_DIR` (backend deploy root, usually `/opt/powerback/app`)
- `REMOTE_FRONTEND_DIR` (static build destination nginx serves, e.g. `/home/deploy/public_html`)
- `SYSTEMD_SERVICE` (default `powerback.service`)

Keep these paths aligned with **`ExecStart`** in `powerback.service` and with **GitHub Actions** secrets `PROD_APP_PATH` / `PROD_PUBLIC_HTML_PATH` if you use CI.

### Run

From the **repository root** on your machine:

```bash
bash scripts/deploy/deploy.remote.sh
```

The script requires branch **`beta`** (see `git rev-parse` check at the top—adjust the script if your policy differs).

### What the script does (high level)

1. Verifies current git branch is `beta`
2. Runs `npm run lint`
3. `rsync`s backend files to `REMOTE_BACKEND_DIR` (excludes `client/`, `node_modules/`, large dev-only trees—see script)
4. Writes a `.version.json` with commit metadata and uploads `package-lock.json`
5. Runs remote `npm ci --omit=dev` as the `powerback` user (see script for cache dir and `sudo` usage)
6. Builds **`client`** locally (`npm install` + `npm run build` in `client/`)
7. `rsync`s `client/build/` to `REMOTE_FRONTEND_DIR`
8. Ensures persistent data dirs and profile-photo symlink under `APP_ROOT`
9. Installs **`scripts/deploy/gh-actions-wrapper.sh`** on the server under `/home/deploy/bin/` (for CI-style restarts)
10. Patches `WorkingDirectory` / `ExecStart` in the systemd unit when present, then **`systemctl daemon-reload`** and **`restart`**
11. Optional security-score logging and `curl` health check against production

### GitHub Actions (alternative)

Push-driven deploys use `.github/workflows/ci_cd.yml` with repository secrets (`PROD_APP_PATH`, `PROD_WRAPPER_SCRIPT`, etc.). See [Production Setup → GitHub Actions CI/CD Deployment](./production-setup.md#github-actions-cicd-deployment). **Manual script deploy and Actions should target the same paths** on the server.

### `launch` / `launch-powerback`

The **`launch`** helper copies secrets and restarts the service; it does **not** replace `deploy.remote.sh` or CI for shipping new code. See [Production Commands](./production-commands.md).

### Destructive tests policy

- Tag destructive Playwright tests with `@destructive`
- Keep destructive Jest suites out of default patterns or exclude them in CI/script flows

### Rollback

- Restart the app (e.g. `sudo systemctl restart powerback.service`) to pick up a **previous** tree only if old artifacts are still on disk; there is no automatic release history in this script.
- Git-level rollback is manual.

### Future enhancements

- Optional GitHub PR creation and checks gating
- Release artifact retention on the server with timestamped bundles
- Hash-based cache busting checks and integrity verification

## Related documentation

- [Production Setup](./production-setup.md) - Production server setup
- [Production Commands](./production-commands.md) - `launch`, systemd, nginx commands
- [Environment Management](./environment-management.md) - Environment configuration
- [Version Information](./version.md) - Dependency versions
- [Development Guide](./development.md) - Development setup
