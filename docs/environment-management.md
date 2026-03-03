# Environment Management Guide

This document explains how to manage environments in the Powerback project with hardened security and secure secret management.

> **📖 Related Documentation:**
>
> - [Development Setup](./development.md) - Development environment setup
> - [Production Setup](./production-setup.md) - Production environment
> - [Deployment Automation](./deployment-automation.md) - Deployment process

## Overview

The project uses a secure, streamlined environment management approach:

- **Development**: Local development with `.env` / `.env.local` containing test keys; shared values use the `REACT_APP_` prefix so the same names work on server and client.
- **Production**: systemd service loads **server-only** config from the service file and temporary secrets file; **shared** (public) config from `/etc/powerback/public.env`.
- **GitHub**: No secrets in codebase (`.env` files are gitignored).
- **Security**: Secrets in `/etc/powerback/secrets/` with temporary file loading; shared/non-secret vars in `public.env`.

## Quick Start

### Environment Management

```bash
# Create your env files for development (from templates; never commit real .env)
cp .env.example.backend .env.local
cp client/.env.example.client client/.env.local
# Edit .env.local and client/.env.local; replace placeholders with your values.

# Start development server
npm run dev

# Start production server locally
npm run start:prod
```

### Deployment Workflow

```bash
# 1. Deploy to production (using existing deployment scripts)
npm run deploy

# 2. Test deployment (dry run)
npm run deploy:dry
```

## Detailed Workflows

### Development Workflow

1. **Create your env files**: Copy `.env.example.backend` to `.env.local` (project root) and `client/.env.example.client` to `client/.env.local`. Replace all placeholders; see comments in those files for where to get API keys.

2. **Start development**:

   ```bash
   npm run dev
   ```

3. **Make changes** to your code

4. **Test locally**:
   ```bash
   npm test
   ```

### Production Deployment

1. **Deploy using existing scripts**:

   ```bash
   npm run deploy
   ```

2. **Test deployment (dry run)**:
   ```bash
   npm run deploy:dry
   ```

### GitHub Commits

1. **Commit changes** (`.env` files are automatically gitignored):
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin beta
   ```

## Environment Files

### Development (`.env` / `.env.local`)

- Contains development environment variables (server and, where needed, `REACT_APP_*` for shared values).
- Uses test keys and local database; safe for local development.
- Automatically loaded by the application at startup.

### Production: How env vars flow

- **Server-only (secrets and server config)**: Stored in `/etc/powerback/secrets/powerback.env` (long-term) and copied to `/etc/powerback/powerback.env` (temporary, deleted after service restart). Loaded by systemd via `EnvironmentFile=` along with the service file. The **service file** (`/etc/systemd/system/powerback.service`) contains only non-secret server configuration (e.g. `NODE_ENV`, `PORT`, `PROD_URL`, `EMAIL_HOST`).
- **Shared (public) config**: Stored in `/etc/powerback/public.env`. Contains all `REACT_APP_*` and other non-secret values that are needed by both backend and frontend (or by the build). The backend reads these at runtime (e.g. `constants/app.js`); the client receives them via the build (Create React App embeds `REACT_APP_*` at build time) or via the API (e.g. `/api/sys/constants`). The service file loads `public.env` so the Node process has them; the build process must also have them (e.g. sourced or passed when running `npm run build`).

### GitHub

- `.env` files are gitignored; no secrets in the codebase.

### Environment variable categories

#### Server-only (secrets + server config)

- In **powerback.service** or **powerback.env** (secrets): `NODE_ENV`, `PORT`, `ORIGIN`, `DEV_URL`, `PROD_URL`, `API_BASEURL`, `MONGODB_URI`, `JWT_SECRET`, `SESSION_SECRET`, `SALT_WORK_FACTOR`, `FEC_API_KEY`, `GOOGLE_CIVICS_API_KEY`, `CONGRESS_GOV_API_KEY`, `STRIPE_*`, `EMAIL_HOST`, `EMAIL_DOMAIN`, `EMAIL_JONATHAN_USER`, `EMAIL_JONATHAN_PASS`, `EMAIL_NO_REPLY_*`, `COOKIE_*`, `BTC_*`, etc. No `REACT_APP_*` here.
- **Optional outgoing webhook**: `HJRES54_WEBHOOK_URL` – when set, the H.J.Res.54 bill watcher POSTs a JSON payload to this URL when the bill has new activity (e.g. for Make.com). See [Webhooks](./webhooks.md#outgoing-hjres54-bill-update-webhook).

#### Shared (REACT*APP*\* and other public config)

- In **public.env** (production) or `.env`/`.env.local` (development). All shared vars use the **REACT*APP*** prefix so they can be read by the backend and, where needed, embedded in the client build. See [Shared (REACT*APP*) variables](#shared-react_app_-variables) below.

#### Client runtime

- Stripe publishable key from `/api/config/stripe-key`; other config from `/api/sys/constants`. No secrets in the client build.

## Configuration Files

- `/etc/systemd/system/powerback.service` – Systemd unit; server-only env vars and `EnvironmentFile=` for `public.env` and temporary `powerback.env`.
- `/etc/powerback/public.env` – Shared/public variables (`REACT_APP_*` and other non-secret config). Loaded by the service and used at build time for the client.
- `/etc/powerback/secrets/powerback.env` – Secure secrets (root-only).
- `/etc/powerback/powerback.env` – Temporary copy of secrets during restart (deleted after).
- `.env` / `.env.local` – Development env vars (gitignored).
- `routes/api/config.js` – Runtime config API for client (e.g. Stripe key).

### File structure (production)

```
/etc/systemd/system/
└── powerback.service             # Server-only env + EnvironmentFile= for public.env and powerback.env

/etc/powerback/
├── public.env                    # REACT_APP_* and other shared (non-secret) config
├── secrets/
│   └── powerback.env             # Secure secrets (root only)
└── powerback.env                 # Temporary secrets (deleted after load)

Project root (development)
├── .env / .env.local             # Development variables (incl. REACT_APP_* for shared values)
```

## Shared (REACT*APP*) variables

All shared configuration that flows from server to backend and (where applicable) into the client uses the **REACT*APP*** prefix. Legacy names without this prefix are no longer used. Backend reads these from `process.env` (e.g. `constants/app.js`); client gets them at build time or via the API.

| Variable                              | Purpose                                 | Example / note                             |
| ------------------------------------- | --------------------------------------- | ------------------------------------------ |
| `REACT_APP_GTAG_ID`                   | Google Analytics tag                    | `G-3YYTWLY9HD`                             |
| `REACT_APP_MIN_PASSWORD_LENGTH`       | Min password length for new users       | `8`                                        |
| `REACT_APP_SHARED_DOMAIN`             | Canonical domain (no scheme)            | `powerback.us`                             |
| `REACT_APP_TAGLINE`                   | App tagline in emails/UI                | `(donation capital)`                       |
| `REACT_APP_CABLE_LOGO_IMG_PATH`       | Nav logo path                           | `/cable-nav.webp`                          |
| `REACT_APP_POSITION_PAPER_PATH`       | Position paper URL path                 | `position-paper.pdf`                       |
| `REACT_APP_EMAIL_SUPPORT_USER`        | Support email address                   | `support@powerback.us`                     |
| `REACT_APP_TWITTER_URL`               | Twitter/X profile URL                   | `https://x.com/PowerbackApp`               |
| `REACT_APP_FACEBOOK_MESSENGER_APP_ID` | Messenger app ID                        | Numeric ID                                 |
| `REACT_APP_DISCORD_INVITE`            | Discord invite URL                      | `https://powerback.us/discord`             |
| `REACT_APP_PATREON_URL`               | Patreon page URL                        | `https://www.patreon.com/powerback`        |
| `REACT_APP_EMAIL_CONTRIBUTORS_USER`   | Contributors email                      | `contributors@powerback.us`                |
| `REACT_APP_POL_IMG_FALLBACK_URL`      | Fallback image base for politicians     | e.g. clerk.house.gov                       |
| `REACT_APP_TWITTER_HASHTAGS`          | Comma-separated hashtags (max 64 chars) | e.g. `NoDonationWithoutRepresentation,...` |
| `REACT_APP_WE_THE_PEOPLE_BILL_URL`    | We The People bill URL                  | congress.gov bill link                     |
| `REACT_APP_GITHUB_FEATURES_DOC_URL`   | GitHub doc URL (e.g. future rerouting)  | GitHub blob URL                            |
| `REACT_APP_GREENGEEKS_SEAL_URL`       | GreenGeeks seal link                    | my.greengeeks.com/seal/                    |
| `REACT_APP_GREENGEEKS_SEAL_IMG_PATH`  | GreenGeeks seal image URL               | static.greengeeks.com                      |
| `REACT_APP_TRUTH_SOCIAL_ENDPOINT`     | Truth Social share URL                  | truthsocial.com/share                      |
| `REACT_APP_TRUTH_SOCIAL_ICON`         | Truth Social icon path                  | assets/truth_social.svg                    |
| `REACT_APP_CAROUSEL_LOADING_MSG`      | Loading message for carousel            | e.g. `Reticulating Shills...`              |

Backend may also use server-only names for the same concepts (e.g. `TWITTER_INTENT_BASE_URL`, `BRANDED_DOMAIN`) where they are not shared with the client; the canonical shared names are the `REACT_APP_*` ones above.

## Email and env debug logging (development)

At **server boot only**, in non-production, the server can log a short summary of email-related env vars (e.g. which `EMAIL_*` keys are set, without exposing passwords). This runs in `lifecycle.js` inside `logStartupConfig`, not in the email sending path. It is controlled by the **START\_** convention: set a value to run, leave blank to skip.

To **enable** this logging:

```bash
START_EMAIL_VAR_LOGGING=1
```

Leave `START_EMAIL_VAR_LOGGING` unset or blank to disable it. This only affects startup logging.

**Startup/smoke flags (START\_\*)**  
All optional startup behaviors (email var logging, watchers, API route tests, etc.) use the same pattern: **`START_<NAME>=1`** to run, **unset or blank** to not run.

## Security

### Secrets Management

- **Development**: Uses `.env` file (gitignored)
- **Production**: Uses secure secret isolation with temporary file loading
- **GitHub**: No secrets in codebase (`.env` files are gitignored)
- **Security**: Secrets stored in `/etc/powerback/secrets/` with root-only access
- **Temporary Loading**: Secrets copied to temporary file, loaded, then deleted

### Safe Commit Process

1. **`.env` files are automatically gitignored** - No risk of committing secrets
2. **No secrets in codebase** - All sensitive data in environment variables
3. **Runtime configuration** - Client loads configuration from API

## Troubleshooting

### Environment Issues

```bash
# Check if .env file exists
ls -la .env

# Check environment variables
cat .env
```

### Deployment Issues

```bash
# Test deployment without actually deploying
npm run deploy:dry

# Check deployment configuration
cat dev/deploy.config.json
```

### API Configuration Issues

```bash
# Test Stripe configuration endpoint
curl -i http://localhost:3001/api/config/stripe-key

# Test constants endpoint
curl -i http://localhost:3001/api/sys/constants
```

## Best Practices

1. **Keep `.env` files gitignored** - Never commit environment files
2. **Use environment variables** - Never hardcode secrets
3. **Test deployments** - Use `npm run deploy:dry` first
4. **Runtime configuration** - Load sensitive config from API
5. **Separate concerns** - Server-side vs client-side variables

## Environment Variables

### Development

- Uses `.env` file with development variables
- Safe for local development with test keys
- Automatically loaded by the application

### Production

- Uses systemd; env vars from `powerback.service`, `/etc/powerback/public.env`, and temporary `/etc/powerback/powerback.env` (secrets).
- Server-only: `JWT_SECRET`, `SESSION_SECRET`, `SALT_WORK_FACTOR`, `MONGODB_URI`, FEC/Google/Congress API keys, Stripe keys, `EMAIL_HOST`, `EMAIL_JONATHAN_USER`, `EMAIL_JONATHAN_PASS`, `EMAIL_NO_REPLY_*`, `DEV_URL`, `PROD_URL`, `API_BASEURL`, etc.
- Shared: all `REACT_APP_*` and other public config in `public.env` (see [Shared (REACT*APP*) variables](#shared-react_app_-variables)).

### GitHub

- No special configuration needed
- `.env` files are automatically gitignored
- Safe for public repository

### Email configuration

- **SMTP (server-only)**: `EMAIL_HOST`, `EMAIL_DOMAIN`, `EMAIL_JONATHAN_USER`, `EMAIL_JONATHAN_PASS`, `EMAIL_NO_REPLY_PASS`, `EMAIL_PORT` (default 465). Used only by the backend for sending.
- **Display addresses (shared)**: `REACT_APP_EMAIL_SUPPORT_USER`, `REACT_APP_EMAIL_CONTRIBUTORS_USER`. Used in templates and API; see [Shared (REACT*APP*) variables](#shared-react_app_-variables).

### Bitcoin Configuration

The system supports Bitcoin donations through HD wallet address generation:

- `BTC_XPUB` - Extended public key (zpub for mainnet, vpub for testnet) at account level `m/84'/coin_type'/0'` (BIP84 format)
- `BTC_NETWORK` - Network selection (`'testnet'` for testnet, omit or any other value for mainnet)

> **📖 For comprehensive Bitcoin donations documentation, see [`docs/bitcoin-donations.md`](./bitcoin-donations.md)**

### SSL Certificate Handling

For production email, the system includes TLS configuration to handle SSL certificate mismatches:

```javascript
tls: {
  rejectUnauthorized: false;
}
```
