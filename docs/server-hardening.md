# Server Hardening and VPS Setup Guide

This document provides a comprehensive guide to the POWERBACK.us production server configuration, security hardening, and operational procedures. It serves as both a setup reference and a maintenance runbook.

> **📖 Related Documentation:**
>
> - [Production Setup](./production-setup.md) - Initial deployment guide
> - [Deployment Automation](./deployment-automation.md) - CI/CD pipeline
> - [Environment Management](./environment-management.md) - Environment configuration
> - [Production Commands](./production-commands.md) - Common operations

## Overview

### What This Server Is

The POWERBACK.us production server hosts a MERN stack application:

- **Backend**: Node.js/Express API running on internal port `<APP_PORT>`
- **Frontend**: React/TypeScript static build served by NGINX
- **Process Management**: systemd (not PM2)
- **Reverse Proxy**: NGINX handles TLS termination and static file serving
- **Database**: MongoDB (Atlas or remote instance)
- **Deployment**: Automated via GitHub Actions CI/CD

### Threat Model Highlights

- **Secrets Protection**: Secrets stored in root-only directory, loaded temporarily during service restart
- **Network Isolation**: Application port (`<APP_PORT>`) bound to loopback only, not publicly exposed
- **User Separation**: Application runs as non-root user (`fc`), deployment uses restricted user (`deploy`)
- **Minimal Attack Surface**: Only HTTP/HTTPS and SSH ports exposed publicly
- **Automated Security**: CI/CD uses restricted SSH wrapper to limit command execution

## Architecture

### Service Architecture

```
Internet
  ↓
NGINX (ports 80, 443)
  ├─ Static files: /home/deploy/public_html (or /home/fc/public_html - CONFIRM)
  └─ API proxy: → http://127.0.0.1:<APP_PORT>
       ↓
systemd service (powerback.service)
  └─ Node.js application (user: fc)
       ├─ Reads secrets from: /etc/powerback/powerback.env (temporary)
       └─ Connects to: MongoDB, Stripe, Email services
```

### Component Responsibilities

| Component   | Purpose                                  | Port         | Access        |
| ----------- | ---------------------------------------- | ------------ | ------------- |
| NGINX       | TLS termination, static files, API proxy | 80, 443      | Public        |
| Node.js App | API server, business logic               | `<APP_PORT>` | Loopback only |
| SSH         | Administrative access                    | 22 (CONFIRM) | Restricted    |
| systemd     | Process management                       | N/A          | Local         |

## Accounts and Access

### User Accounts

| Username | Purpose                  | Home Directory | Shell Access | Sudo    |
| -------- | ------------------------ | -------------- | ------------ | ------- |
| `fc`     | Application runtime user | `/home/fc`     | Yes          | CONFIRM |
| `deploy` | CI/CD deployment user    | `/home/deploy` | Restricted   | No      |
| `root`   | System administration    | `/root`        | Yes          | N/A     |

### Application Runtime User (`fc`)

- **Purpose**: Runs the Node.js application via systemd
- **Working Directory**: `/home/fc/nodejsapp` (CONFIRM: may be `/opt/powerback/app`)
- **Node.js**: Installed via nvm at `/home/fc/.nvm/versions/node/v20.19.5/bin/node`
- **Permissions**: Owns application files, can read temporary secrets file during service start

**Verification:**

```bash
id fc
getent passwd fc
ls -ld /home/fc
ls -ld /home/fc/nodejsapp /opt/powerback/app 2>/dev/null || echo "Confirm actual app path"
```

### Deployment User (`deploy`)

- **Purpose**: GitHub Actions CI/CD deployment operations
- **Restrictions**: SSH access limited via wrapper script `/home/deploy/bin/gh-actions-wrapper.sh`
- **Allowed Commands** (via wrapper):
  - `pbnpminstall` - Install npm dependencies
  - `pbrestart` - Restart powerback service
  - `nginxreload` - Reload NGINX configuration
  - `pbstatus` - Check service status (optional)
  - `pbsecurity` - Security check (optional)
  - `pbwhoami` - Identity verification (optional)

**Security Intent**: The `deploy` user should NOT have broad shell access. It should be constrained to a small command surface via the SSH wrapper.

**Verification:**

```bash
id deploy
getent passwd deploy
ls -l /home/deploy/bin/gh-actions-wrapper.sh
cat /home/deploy/.ssh/authorized_keys | grep -A 5 "deploy"
```

## Directory Layout and Permissions

### Critical Paths

| Path                                   | Purpose                                     | Owner                      | Permissions | Notes                                |
| -------------------------------------- | ------------------------------------------- | -------------------------- | ----------- | ------------------------------------ |
| `/opt/powerback/app`                   | Backend application code                    | `deploy:deploy` or `fc:fc` | CONFIRM     | CI/CD syncs here                     |
| `/home/deploy/public_html`             | Frontend static files                       | `deploy:deploy`            | `755`       | NGINX serves from here               |
| `/home/fc/public_html`                 | Alternative frontend path                   | `fc:fc`                    | `755`       | CONFIRM: may be used instead         |
| `/etc/powerback/public.env`            | Shared (REACT*APP*\*) and non-secret config | `root:root` or `fc:fc`     | `644`       | Loaded by systemd; no secrets        |
| `/etc/powerback/secrets/`              | Long-term secrets storage                   | `root:root`                | `700`       | Root-only access                     |
| `/etc/powerback/secrets/powerback.env` | Canonical secrets file                      | `root:root`                | `600`       | Never readable by non-root           |
| `/etc/powerback/powerback.env`         | Temporary runtime secrets                   | `fc:fc`                    | `600`       | Created during deploy, deleted after |
| `/var/lib/powerback/`                  | Persistent data                             | CONFIRM                    | CONFIRM     | Deltas, snapshots, pfp files         |
| `/var/log/powerback/`                  | Application logs                            | CONFIRM                    | CONFIRM     | Deployment logs                      |

**Path Conflicts to Resolve:**

1. **Application Path**: Documentation shows both `/home/fc/nodejsapp` (systemd service) and `/opt/powerback/app` (CI/CD). Confirm which is active.
2. **Frontend Path**: Documentation shows both `/home/fc/public_html` (NGINX example) and `/home/deploy/public_html` (CI/CD). Confirm which NGINX actually uses.

**Verification:**

```bash
# Application paths
ls -ld /opt/powerback /opt/powerback/app
ls -ld /home/fc/nodejsapp 2>/dev/null || echo "Path does not exist"

# Frontend paths
ls -ld /home/deploy/public_html
ls -ld /home/fc/public_html 2>/dev/null || echo "Path does not exist"

# Secrets directory
ls -ld /etc/powerback /etc/powerback/secrets
ls -l /etc/powerback/secrets/powerback.env

# Persistent data
ls -ld /var/lib/powerback 2>/dev/null || echo "Directory does not exist"
ls -ld /var/log/powerback 2>/dev/null || echo "Directory does not exist"
```

## Secrets Management

### Security Pattern

Secrets are managed using a temporary file loading pattern to minimize exposure:

1. **Long-term Storage**: Secrets stored in `/etc/powerback/secrets/powerback.env` (root-only, `chmod 700` directory, `chmod 600` file)
2. **Temporary Loading**: During deployment, secrets are copied to `/etc/powerback/powerback.env` with `chmod 600` and `chown fc:fc`
3. **Service Start**: systemd reads `/etc/powerback/powerback.env` via `EnvironmentFile=` directive
4. **Cleanup**: Temporary file is deleted after service restart completes

### Why This Pattern?

- **Minimizes Exposure Window**: Secrets exist in readable form only during service restart
- **Process Inheritance**: systemd loads environment variables at process start
- **Audit Trail**: Secrets file deletion can be logged/verified
- **No Persistent Secrets**: Application never has long-term access to readable secrets file

### Deployment Script

The helper script `/usr/local/bin/launch-powerback` (or shell alias `launch`) performs:

```bash
# 1. Copy secrets to temporary location
sudo cp /etc/powerback/secrets/powerback.env /etc/powerback/powerback.env

# 2. Set restrictive permissions
sudo chmod 600 /etc/powerback/powerback.env
sudo chown fc:fc /etc/powerback/powerback.env

# 3. Restart service (systemd reads the temp file)
sudo systemctl restart powerback.service

# 4. Delete temporary file
sudo rm /etc/powerback/powerback.env
```

**Verification:**

```bash
# Check secrets directory security
ls -ld /etc/powerback/secrets
ls -l /etc/powerback/secrets/powerback.env

# Verify temporary file is deleted (should not exist)
ls -l /etc/powerback/powerback.env 2>&1

# Check if service can read secrets (should show env vars)
sudo systemctl show powerback.service --property=EnvironmentFile
```

### Secrets File Format

The secrets file contains key-value pairs (one per line):

```bash
# Example format (DO NOT include actual secrets in documentation)
JWT_SECRET=<REDACTED>
SESSION_SECRET=<REDACTED>
MONGODB_URI=<REDACTED>
FEC_API_KEY=<REDACTED>
STRIPE_SK_LIVE=<REDACTED>
EMAIL_JONATHAN_PASS=<REDACTED>
# ... other secrets
```

**Important**: Keep ALL secrets in `/etc/powerback/secrets/powerback.env`. Do NOT put secrets in the systemd service unit file (`/etc/systemd/system/powerback.service`).

### Public configuration (`/etc/powerback/public.env`)

Non-secret, shared configuration (all `REACT_APP_*` and other vars needed by both backend and frontend) lives in `/etc/powerback/public.env`. This file is loaded by the systemd service via `EnvironmentFile=` and is not deleted after restart. The service file itself is limited to server-only configuration (e.g. `NODE_ENV`, `PORT`, `PROD_URL`, `EMAIL_HOST`). See [Environment Management](./environment-management.md#shared-react_app_-variables) for the list of shared variables.

## systemd Services

### Service Configuration

**Service File**: `/etc/systemd/system/powerback.service`

Use the repo template **`powerback.service.template`** (project root). Copy to `/etc/systemd/system/powerback.service` and replace the placeholders (e.g. `{{USER}}`, `{{GROUP}}`, `{{NODE_BIN}}`, `{{APP_SERVER_PATH}}`, `{{SERVER_NAME}}`, `{{STATIC_PUBLIC_DIR}}`). See [Production Setup](./production-setup.md#3-create-systemd-service) for the placeholder table.

**Key Characteristics:**

- `Type=simple` - Standard service type
- `User=` / `Group=` - Non-root user (set via `{{USER}}`, `{{GROUP}}`)
- `ExecStart=` - Node binary and `server.js` path (set via `{{NODE_BIN}}`, `{{APP_SERVER_PATH}}`)
- `EnvironmentFile=/etc/powerback/powerback.env` - Loads secrets (root-owned)
- `EnvironmentFile=/etc/powerback/public.env` - Loads shared (REACT*APP*\*) and non-secret config
- `LogsDirectory=powerback`, `StateDirectory=powerback`, `ReadWritePaths=` - Sandboxed dirs
- Hardening: `PrivateTmp`, `ProtectSystem=full`, `NoNewPrivileges`, `RestrictAddressFamilies`, etc.
- `Restart=always`, `RestartSec=10` - Automatic restart on failure

### Service Management Commands

```bash
# Reload systemd configuration (after editing service file)
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable powerback.service

# Start the service
sudo systemctl start powerback.service

# Stop the service
sudo systemctl stop powerback.service

# Restart the service
sudo systemctl restart powerback.service

# Check service status
sudo systemctl status powerback.service

# View service logs
sudo journalctl -u powerback.service -n 50
sudo journalctl -u powerback.service --since today
sudo journalctl -u powerback.service -f --no-pager -o short-iso

# Convenience command (if available)
powerback-logs
```

**Verification:**

```bash
# View complete service configuration
systemctl cat powerback.service

# Check service status
systemctl status powerback.service --no-pager

# View recent logs
journalctl -u powerback.service -n 200 --no-pager

# Verify service is running
systemctl is-active powerback.service
```

## NGINX Reverse Proxy and TLS

### Configuration Location

**Config Path**: `/etc/nginx/conf.d/users/fc.conf` (for cPanel-managed servers)

Alternative locations to check:

- `/etc/nginx/sites-enabled/powerback`
- `/etc/nginx/sites-available/powerback`

### Key Behaviors

1. **TLS Termination**: Listens on ports 80 (HTTP) and 443 (HTTPS), IPv4 and IPv6
2. **HTTP/2**: Enabled for HTTPS connections
3. **HTTPS Redirect**: All HTTP requests redirect to HTTPS
4. **Static File Serving**: Serves React frontend build from document root
5. **API Proxying**: Proxies `/api/` and `/position-paper.pdf` to backend on `127.0.0.1:<APP_PORT>`
6. **Cookie Handling**: Normalizes cookie domain and path for cross-subdomain support
7. **One-time/token routes**: Routes like `/reset`, `/unsubscribe`, and similar token-based or one-time links should send `X-Robots-Tag: noindex, nofollow` (and optionally `noarchive`) so crawlers do not index or follow them. Add a `location` block for each such path with `add_header X-Robots-Tag "noindex, nofollow";` (and ensure the SPA still receives the request for client-side routing).

### TLS Certificate Management

Certificates are managed by the hosting provider/cPanel:

- **Certificate**: `/home/fc/ssl/certs/powerback_us_cert.crt`
- **Private Key**: `/home/fc/ssl/keys/powerback_us_key.key`

**Note**: Certificate management is provider-driven. Confirm actual paths and renewal process on server.

### Example Configuration (Redacted)

```nginx
server {
    server_name powerback.us www.powerback.us api.powerback.us;
    listen 80;
    listen [::]:80;
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;

    # SSL Configuration
    ssl_certificate /home/fc/ssl/certs/powerback_us_cert.crt;
    ssl_certificate_key /home/fc/ssl/keys/powerback_us_key.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Force HTTPS
    if ($scheme = http) {
        return 301 https://$host$request_uri;
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Proxy position paper PDF to Node.js backend
    location = /position-paper.pdf {
        proxy_pass http://127.0.0.1:<APP_PORT>;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API only
    location /api/ {
        add_header X-Robots-Tag "noindex, nofollow, nosnippet, noarchive" always;

        proxy_pass http://127.0.0.1:2512;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Magic-link SPA routes: noindex + always fall back to SPA
    location ~ ^/(reset|unsubscribe|join|activate)(/|$) {
        add_header X-Robots-Tag "noindex, nofollow, nosnippet, noarchive" always;
        try_files $uri $uri/ /index.html;
    }

    # React SPA default
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: cache immutable static assets
    location ~* \.(js|css|png|webp|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

}
```

### Operational Commands

```bash
# Test NGINX configuration syntax
sudo nginx -t

# View full configuration
sudo nginx -T | head -200

# Reload NGINX configuration (no downtime)
sudo systemctl reload nginx

# Restart NGINX (brief downtime)
sudo systemctl restart nginx

# Check NGINX status
sudo systemctl status nginx

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log
```

**Verification:**

```bash
# Test configuration
nginx -t

# View configuration (first 200 lines)
nginx -T | sed -n '1,200p'

# Check config file locations
ls -l /etc/nginx/conf.d/users/
ls -l /etc/nginx/sites-enabled/ /etc/nginx/sites-available/ 2>/dev/null || true

# Verify NGINX is running
systemctl status nginx --no-pager
```

## Network Ports and Firewall

### Port Exposure

| Port         | Protocol | Service | Access        | Purpose                              |
| ------------ | -------- | ------- | ------------- | ------------------------------------ |
| 80           | TCP      | NGINX   | Public        | HTTP (redirects to HTTPS)            |
| 443          | TCP      | NGINX   | Public        | HTTPS (TLS)                          |
| 22           | TCP      | SSH     | Restricted    | Administrative access (CONFIRM port) |
| `<APP_PORT>` | TCP      | Node.js | Loopback only | Internal API (MUST NOT be public)    |

### Port Verification

**Critical**: Port `<APP_PORT>` must be bound to `127.0.0.1` only, not `0.0.0.0`.

```bash
# List all listening ports
ss -lntp

# Check specific ports
ss -lntp | grep -E '(:22|:80|:443|:<APP_PORT>)\b'

# Verify <APP_PORT> is loopback-only (should show 127.0.0.1:<APP_PORT>, not 0.0.0.0:<APP_PORT>)
ss -lntp | grep :<APP_PORT>
```

### Firewall Configuration

**CONFIRM**: Which firewall is active on the server.

The production setup guide mentions UFW, but the server may use:

- **UFW** (Uncomplicated Firewall)
- **firewalld** (Red Hat/CentOS)
- **CSF** (ConfigServer Security & Firewall)
- **iptables** (direct)
- **Provider-managed firewall** (cloud provider)

**Detection Commands:**

```bash
# Check for UFW
command -v ufw && ufw status verbose || echo "UFW not found"

# Check for firewalld
command -v firewall-cmd && firewall-cmd --list-all || echo "firewalld not found"

# Check for CSF
command -v csf && csf -l || echo "CSF not found"

# Check iptables directly
iptables -S 2>/dev/null | head -20 || echo "iptables not accessible"
```

**Expected Rules** (if UFW is active):

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Verify status
sudo ufw status verbose
```

**Verification:**

```bash
# Run detection commands above and document actual firewall in use
# Then verify rules allow only 22, 80, 443 from external sources
# Verify <APP_PORT> is NOT accessible externally
```

## SSH Hardening

### Recommended Settings

SSH should be hardened with the following (CONFIRM current server configuration):

- **Key-only authentication**: Disable password authentication
- **No root login**: Prevent direct root SSH access
- **Restricted users**: Limit which users can SSH
- **Modern ciphers**: Use only secure cipher suites
- **Rate limiting**: Reduce brute force attack surface
- **Short login grace time**: Limit connection attempts

### Verification Commands

```bash
# Check SSH configuration
sshd -T | grep -E '(port |passwordauthentication|permitrootlogin|pubkeyauthentication|allowusers|logingracetime|maxauthtries)'

# Expected output (example):
# port 22
# passwordauthentication no
# permitrootlogin no
# pubkeyauthentication yes
# logingracetime 60
# maxauthtries 3
```

### SSH Configuration File

**Location**: `/etc/ssh/sshd_config`

**Recommended Settings** (CONFIRM what's actually configured):

```bash
Port 22  # CONFIRM: may be non-standard port
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
LoginGraceTime 60
MaxAuthTries 3
AllowUsers fc deploy  # CONFIRM: actual allowed users
```

**After Changes:**

```bash
# Test configuration
sudo sshd -t

# Reload SSH daemon
sudo systemctl reload sshd
```

## Monitoring and Logs

### Application Logs

**Primary Log Location**: systemd journal

```bash
# View recent logs
sudo journalctl -u powerback.service -n 50

# View logs from today
sudo journalctl -u powerback.service --since today

# Follow logs in real-time
sudo journalctl -u powerback.service -f --no-pager -o short-iso

# View logs with timestamps
sudo journalctl -u powerback.service --since "1 hour ago" -o short-iso

# Convenience command (if available)
powerback-logs
```

### NGINX Logs

**Access Log**: `/var/log/nginx/access.log`
**Error Log**: `/var/log/nginx/error.log`

```bash
# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log

# Search for errors
sudo grep -i error /var/log/nginx/error.log | tail -20
```

### Deployment Logs

**Location**: `/var/log/powerback/deploy.log` (CONFIRM creation, ownership, rotation)

```bash
# View deployment logs
sudo tail -f /var/log/powerback/deploy.log

# Check log rotation
ls -lh /var/log/powerback/
```

### System Monitoring

**What to Monitor:**

- Service status (systemd)
- Application health (API endpoints)
- Disk space
- Memory usage
- Network connectivity
- SSL certificate expiration

**Basic Health Checks:**

```bash
# Service status
systemctl is-active powerback.service

# API health check
curl -I https://powerback.us/api/sys/constants

# Disk space
df -h

# Memory usage
free -h

# Check SSL certificate expiration
echo | openssl s_client -servername powerback.us -connect powerback.us:443 2>/dev/null | openssl x509 -noout -dates
```

### Monitoring Tools

**Current Status**: CONFIRM if monitoring tools are installed (e.g., Prometheus, Grafana, Datadog, New Relic).

If not configured, this is a recommended next step for production monitoring.

## Backups and Recovery

### Backup Strategy

**Current Status**: CONFIRM backup configuration.

**What Should Be Backed Up:**

1. **Application Code**: Version controlled in Git (GitHub)
2. **Secrets**: `/etc/powerback/secrets/powerback.env` (CRITICAL - secure backup location)
3. **Persistent Data**: `/var/lib/powerback/` (deltas, snapshots, pfp files)
4. **Configuration Files**:
   - `/etc/systemd/system/powerback.service`
   - `/etc/nginx/conf.d/users/fc.conf` (or sites-enabled equivalent)
   - `/home/deploy/bin/gh-actions-wrapper.sh`
5. **SSL Certificates**: `/home/fc/ssl/` (if managed locally)

### Backup Verification

```bash
# Check for backup scripts
ls -la /etc/cron.* /etc/cron.d 2>/dev/null
crontab -l 2>/dev/null
sudo crontab -l 2>/dev/null

# Check for scheduled backup jobs
systemctl list-timers --all --no-pager | grep -i backup

# Check backup storage location (CONFIRM)
# Common locations: /var/backups, /opt/backups, external storage
```

### Recovery Procedures

**Service Recovery:**

```bash
# If service fails to start
sudo systemctl status powerback.service
sudo journalctl -u powerback.service -n 100

# Restart with fresh secrets
launch
# or
/usr/local/bin/launch-powerback

# Verify service is running
systemctl is-active powerback.service
curl -I https://powerback.us/api/sys/constants
```

**Secrets Recovery:**

If secrets file is lost, restore from secure backup location (CONFIRM backup location and restore procedure).

**Data Recovery:**

If persistent data is lost, restore from backups in `/var/lib/powerback/` (CONFIRM backup and restore procedures).

## Maintenance and Patching

### Security Updates

**Automatic Updates**: CONFIRM if automatic security updates are enabled.

**Check for Auto-Update Configuration:**

```bash
# Check for unattended-upgrades (Debian/Ubuntu)
systemctl status unattended-upgrades --no-pager || echo "Not configured"

# Check for automatic updates (RHEL/CentOS)
systemctl status dnf-automatic --no-pager || echo "Not configured"

# Check update timers
systemctl list-timers --all --no-pager | grep -E '(apt|dnf|yum|unattended|automatic)'
```

**Manual Update Procedure:**

```bash
# Update package lists
sudo apt update  # Debian/Ubuntu
# or
sudo dnf check-update  # RHEL/CentOS

# Upgrade packages
sudo apt upgrade -y  # Debian/Ubuntu
# or
sudo dnf upgrade -y  # RHEL/CentOS

# Reboot if kernel updates were installed
sudo reboot
```

### Regular Maintenance Tasks

**Weekly:**

- Review application logs for errors
- Check disk space usage
- Verify service health
- Review NGINX error logs

**Monthly:**

- Review security updates
- Check SSL certificate expiration
- Verify backup integrity
- Review firewall rules
- Audit user access

**Quarterly:**

- Review and update secrets (rotate if needed)
- Review systemd service configuration
- Review NGINX configuration
- Security audit

### Scheduled Jobs

**Verification:**

```bash
# Check user crontabs
crontab -l 2>/dev/null
sudo crontab -l 2>/dev/null

# Check system cron directories
ls -la /etc/cron.* /etc/cron.d 2>/dev/null

# Check systemd timers
systemctl list-timers --all --no-pager
```

## Troubleshooting Checklist

### Service Not Starting

```bash
# 1. Check service status
sudo systemctl status powerback.service --no-pager

# 2. Check logs for errors
sudo journalctl -u powerback.service -n 100 --no-pager

# 3. Verify secrets file exists (temporary)
ls -l /etc/powerback/powerback.env

# 4. Verify secrets source exists
ls -l /etc/powerback/secrets/powerback.env

# 5. Check Node.js binary exists
ls -l /home/fc/.nvm/versions/node/v20.19.5/bin/node

# 6. Check working directory exists
ls -ld /home/fc/nodejsapp  # or /opt/powerback/app

# 7. Verify app.js exists in working directory
ls -l /home/fc/nodejsapp/app.js  # or /opt/powerback/app/app.js
```

### NGINX 502 Bad Gateway

```bash
# 1. Check if application is running
systemctl is-active powerback.service

# 2. Check if port <APP_PORT> is listening
ss -lntp | grep :<APP_PORT>

# 3. Test backend directly
curl http://127.0.0.1:<APP_PORT>/api/sys/constants

# 4. Check NGINX error log
sudo tail -20 /var/log/nginx/error.log

# 5. Verify NGINX configuration
sudo nginx -t

# 6. Check service logs
sudo journalctl -u powerback.service -n 50
```

### Environment Variables Not Loading

```bash
# 1. Check if secrets file exists
ls -l /etc/powerback/secrets/powerback.env

# 2. Check if temporary file exists (should exist during service run)
ls -l /etc/powerback/powerback.env

# 3. Verify service EnvironmentFile setting
systemctl show powerback.service --property=EnvironmentFile

# 4. Check service environment (redacted)
systemctl show powerback.service --property=Environment

# 5. Restart with fresh secrets
launch
```

### Deployment Failures

```bash
# 1. Check deployment logs
sudo tail -50 /var/log/powerback/deploy.log

# 2. Verify wrapper script permissions
ls -l /home/deploy/bin/gh-actions-wrapper.sh

# 3. Test wrapper commands manually
sudo -u deploy /home/deploy/bin/gh-actions-wrapper.sh pbnpminstall
sudo -u deploy /home/deploy/bin/gh-actions-wrapper.sh pbstatus

# 4. Check application path
ls -ld /opt/powerback/app

# 5. Check frontend path
ls -ld /home/deploy/public_html
```

## "Confirm on Server" Data Collection

Run these commands on the production server and document the outputs to resolve ambiguities in this documentation.

### Server Identity

```bash
cat /etc/os-release
uname -a
hostnamectl
timedatectl
```

### Users and Permissions

```bash
id fc
id deploy
getent passwd fc deploy
ls -ld /opt/powerback /opt/powerback/app
ls -ld /home/deploy/public_html /home/fc/public_html
ls -ld /etc/powerback /etc/powerback/secrets
ls -l /etc/powerback/secrets/powerback.env
```

### systemd Service Truth

```bash
systemctl cat powerback.service
systemctl status powerback.service --no-pager
journalctl -u powerback.service -n 200 --no-pager
```

### NGINX Truth

```bash
nginx -t
nginx -T | sed -n '1,200p'
ls -l /etc/nginx/conf.d/users/
ls -l /etc/nginx/sites-enabled/ /etc/nginx/sites-available/ || true
```

### Listening Ports

```bash
ss -lntp
ss -lntp | grep -E '(:22|:80|:443|:<APP_PORT>)\b'
```

### Firewall Detection

```bash
command -v ufw && ufw status verbose || true
command -v firewall-cmd && firewall-cmd --list-all || true
command -v csf && csf -l || true
iptables -S || true
```

### SSH Hardening Verification

```bash
sshd -T | grep -E '(port |passwordauthentication|permitrootlogin|pubkeyauthentication|allowusers|logingracetime|maxauthtries)'
```

### Fail2ban (if present)

```bash
systemctl status fail2ban --no-pager || true
fail2ban-client status || true
```

### Auto Security Updates

```bash
systemctl list-timers --all | grep -E '(apt|dnf|yum|unattended|automatic)' || true
```

### Backups and Scheduled Jobs

```bash
crontab -l || true
sudo crontab -l || true
ls -la /etc/cron.* /etc/cron.d || true
systemctl list-timers --all --no-pager
```

## Related Documentation

- [Production Setup](./production-setup.md) - Initial deployment guide
- [Deployment Automation](./deployment-automation.md) - CI/CD pipeline details
- [Environment Management](./environment-management.md) - Environment variable configuration
- [Production Commands](./production-commands.md) - Common operational commands

---

_Last updated: January 2025_
