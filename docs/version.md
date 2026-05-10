# POWERBACK.us Version Information

This document tracks the major dependencies and tools used in the POWERBACK.us project. **Exact versions for Node are pinned** in [.nvmrc](../.nvmrc); npm package ranges live in [`package.json`](../package.json) and [`client/package.json`](../client/package.json).

## Current build versions

### Core runtime

- **Node.js**: **20.19.6** pinned in [.nvmrc](../.nvmrc) for development (see [Development Setup](./development.md)); production often matches **20.x** (adjacent patch levels such as 20.19.5 are normal until the next deploy aligns the pin)
- **npm**: 10.x (ships with Node 20)
- **MongoDB (server)**: Version is whatever backs `MONGODB_URI`—query with `mongosh` (see below). Local installs are often **7.x** or **8.x** on current Ubuntu (see [Local MongoDB Setup](./local-mongodb-setup.md)); hosted clusters may be **5.x** or newer depending on when they were provisioned

### Frontend stack

- **React**: 18.x (UI framework)
- **TypeScript**: 4.9.x (type system)
- **Bootstrap**: 5.x and **React-Bootstrap**: 2.x (UI components)
- **Bundling**: Webpack 5 via `react-scripts` and **CRACO** (`@craco/craco`) in `client/` (see [npm-scripts](./npm-scripts.md) / client `package.json` scripts)

### Backend stack

- **Express**: 4.x (web framework)
- **Mongoose**: 6.x with **mongodb** Node driver 4.x (ODM / driver)
- **Authentication**: JWT-based sessions (`jsonwebtoken`, HTTP-only cookies; see `auth/`)
- **Joi**: 17.x (validation)

### Payment and external services

- **Stripe**: 8.x (server SDK—see [`package.json`](../package.json))
- **Congress.gov API**: v3 (legislative data)
- **OpenFEC API**: v1 (campaign finance)
- **Google Civics API**: v2 (representative lookup)

### Development tools

- **Jest**: 30.x root; client tests via **react-scripts**/CRACO
- **Playwright**: 1.x (e2e)
- **ESLint**: 8.x with TypeScript ESLint plugins
- **Nodemon**: 2.x (backend dev reload)
- **Prettier**: 3.x (formatting—often via ESLint integration)

### Production operations

- **systemd**: `powerback.service` manages the Node process (see [`powerback.service.template`](../powerback.service.template) and [Production Setup](./production-setup.md), [Production Commands](./production-commands.md))
- **nginx**: Reverse proxy / TLS termination in front of the app (same docs as above)
- **MongoDB Atlas** or other hosted MongoDB: Common in production; alternatively self-hosted (see [Remote MongoDB Setup](./remote-mongodb-setup.md))

## Verifying versions (dev machine vs VPS)

Use these so results match what the repo and deployment actually use.

| What                                 | Where to run it                                                                   | Command / note                                                                                                                                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node**                             | Any shell                                                                         | `node -v`                                                                                                                                                                                                                  |
| **`.nvmrc`**                         | **Repository root** (e.g. clone on laptop, or `/opt/powerback/app` on the server) | `cat .nvmrc` — not in `$HOME` unless you copied the repo there                                                                                                                                                             |
| **npm**                              | Same                                                                              | `npm -v`                                                                                                                                                                                                                   |
| **Installed npm deps** (e.g. Stripe) | Directory that contains **root** `package.json`                                   | `cd /path/to/powerback && npm ls stripe mongoose express --depth=0` — from `$HOME` without a project, `npm ls` shows nothing useful                                                                                        |
| **MongoDB server version**           | Any host with `mongosh` and your URI                                              | `mongosh "$MONGODB_URI" --eval "db.version()"` — this is the version of the **database cluster** your app uses. Local `mongod --version` only applies if you run a server on that box and your user can execute the binary |
| **App under systemd**                | VPS                                                                               | `systemctl status powerback.service --no-pager`, `systemctl show powerback.service -p ExecStart --value`                                                                                                                   |
| **nginx**                            | VPS                                                                               | `nginx -v`, `sudo nginx -t`, `sudo systemctl status nginx --no-pager`                                                                                                                                                      |

## Environment requirements

### Development

- Node.js **20.19.x** or compatible **20.x** (match `.nvmrc` when possible)
- MongoDB (local recommended—see [Local MongoDB Setup](./local-mongodb-setup.md))
- Git
- Modern browser for manual testing

### Production

- Node.js aligned with what you run in CI and on the server—**prefer the same major line as [.nvmrc](../.nvmrc)** for fewer surprises
- **systemd** unit for the app (not PM2)
- SSH access and secrets management as documented in ops guides
- TLS (e.g., via nginx certificates)

## Version update history

### Last updated

- **Date**: May 2026
- **Reason**: Sync with `.nvmrc`, `package.json`, and systemd-based production docs; replace obsolete PM2 and incorrect stack notes (e.g., Mongoose 7, outdated auth stack descriptions).

### Earlier notes (historical)

- Node upgraded over time toward current **20.x** line (see `.nvmrc`).
- React 18 for concurrent features and ecosystem alignment.

## Upgrade considerations

### Breaking changes (check when bumping majors)

- **Node**: Native addons and toolchain must support the chosen Node release.
- **React**: Major upgrades follow the React migration guides.
- **MongoDB**: Server upgrade paths and compatibility—not all query options behave the same across server versions.

### Compatibility

- Prefer running the same **Node major** in development (`nvm use`) as in production.
- API routes aim for backward compatibility for existing clients within a release train.

## Related documentation

- [Development Setup Guide](./development.md)
- [Production Setup](./production-setup.md) and [Production Commands](./production-commands.md)
- [Deployment Automation](./deployment-automation.md)
- [API Documentation](./API.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [NPM Scripts](./npm-scripts.md)

## Support

For version-specific or upgrade questions, start with [Development Setup](./development.md) and the linked ops docs above. Contact: [support@powerback.us](mailto:support@powerback.us)
