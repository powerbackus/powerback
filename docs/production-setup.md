# Production Setup Guide

This guide covers deploying POWERBACK.us to a production server with hardened security and proper environment management.

## Overview

The production deployment uses:

- **Systemd** for process management
- **NGINX** for reverse proxy and static file serving
- **Secure environment variables** with temporary file loading
- **SSL certificates** for secure connections
- **Hardened security** with secrets isolation

## Prerequisites

- Production server with root access
- Domain configured with DNS
- SSL certificate installed
- MongoDB Atlas or local MongoDB instance
- Email service configured

## Server Setup

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install NGINX
sudo apt install nginx -y
```

### 2. Create Application User

```bash
# Create user for the application
sudo useradd -m -s /bin/bash fc
sudo usermod -aG sudo fc

# Switch to application user
sudo su - fc
```

### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/powerback.git
cd powerback

# Install dependencies
npm install

# Build client
# Note: The prebuild hook automatically runs scripts/build/build-faq.js to generate
# FAQ JSON-LD schema and markdown documentation before building
cd client && npm install && npm run build && cd ..
```

## Environment Configuration

### 1. Setup Production Environment

```bash
# Switch to production environment
npm run env:switch production

# Or manually create environment file
npm run setup:remote-dev
```

### 2. Configure Secure Environment Variables

Create a secure secrets directory and environment file:

```bash
# Create secure secrets directory
sudo mkdir -p /etc/powerback/secrets
sudo chmod 700 /etc/powerback/secrets
sudo chown root:root /etc/powerback/secrets

# Create environment file with secrets
sudo nano /etc/powerback/secrets/powerback.env
```

Add your secrets to `/etc/powerback/secrets/powerback.env` (no `REACT_APP_*` or other public vars here):

```bash
JWT_SECRET=your-actual-jwt-secret
SESSION_SECRET=your-actual-session-secret
MONGODB_URI=your-actual-mongodb-uri
FEC_API_KEY=your-actual-fec-key
# ... other secrets (EMAIL_JONATHAN_PASS, STRIPE keys, etc.)
```

### 2b. Create public configuration (`/etc/powerback/public.env`)

Create `/etc/powerback/public.env` with all **shared** (REACT*APP*_) and other non-secret config. This file is loaded by the systemd service and is also used at build time for the client. Do not put secrets here. See [Environment Management](./environment-management.md#shared-react_app_-variables) for the full list of `REACT*APP*_`variables (e.g.`REACT_APP_SHARED_DOMAIN`, `REACT_APP_EMAIL_SUPPORT_USER`, `REACT_APP_POSITION_PAPER_PATH`, `REACT_APP_TAGLINE`, etc.).

```bash
sudo nano /etc/powerback/public.env
```

### 3. Create Systemd Service

Use the template from the repo: **`powerback.service.template`** (project root). Copy it to the systemd directory and replace placeholders:

```bash
sudo cp powerback.service.template /etc/systemd/system/powerback.service
sudo nano /etc/systemd/system/powerback.service   # replace {{USER}}, {{GROUP}}, {{NODE_BIN}}, {{APP_SERVER_PATH}}, etc.
```

Placeholders in the template:

| Placeholder             | Example                        |
| ----------------------- | ------------------------------ |
| `{{USER}}`              | `powerback`                    |
| `{{GROUP}}`             | `powerback`                    |
| `{{NODE_BIN}}`          | `/usr/bin/node`                |
| `{{APP_SERVER_PATH}}`   | `/opt/powerback/app/server.js` |
| `{{SERVER_NAME}}`       | `vps.powerback.us`             |
| `{{STATIC_PUBLIC_DIR}}` | `/home/deploy/public_html`     |

Secrets and other env (PORT, ORIGIN, API keys, etc.) go in `/etc/powerback/powerback.env` and `/etc/powerback/public.env`; the service loads both via `EnvironmentFile=`. See [Environment Management](./environment-management.md).

### 4. Start Application with Systemd

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable powerback.service

# Start the service
sudo systemctl start powerback.service

# Check status
sudo systemctl status powerback.service
```

## NGINX Configuration

### 1. Create NGINX Configuration

Create `/etc/nginx/conf.d/users/fc.conf` (for cPanel managed servers):

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

    # Proxy position paper PDF to Node.js backend (serves file with clean URL)
    location = /position-paper.pdf {
        proxy_pass http://127.0.0.1:2512;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Discord server join link
    location = /discord {
        return 301 https://discord.gg/tSuTk6R2uG;
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

### 2. Enable Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/powerback /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

## Email Configuration

### 1. Email Environment Variables

Ensure these variables are set in your production environment:

```bash
EMAIL_HOST=mail.powerback.us
EMAIL_DOMAIN=powerback.us
EMAIL_JONATHAN_USER=your-email@powerback.us
EMAIL_JONATHAN_PASS=your-email-password
EMAIL_NO_REPLY_PASS=your-no-reply-password
EMAIL_PORT=465
```

### 2. SSL Certificate Issues

If you encounter SSL certificate errors:

```javascript
// In controller/comms/sendEmail.js
const CONFIG = {
  // ... other config
  tls: {
    rejectUnauthorized: false, // Bypass SSL certificate validation
  },
};
```

## Security Configuration

### 1. Firewall Setup

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. File Permissions

```bash
# Set proper permissions
sudo chown -R fc:fc /home/fc/powerback
chmod 600 /home/fc/powerback/.env
```

### 3. Environment Variable Security

- Never commit `.env` files to version control
- Use the service environment file for production
- Store secrets in secure environment variables
- Use different secrets for development and production

## Monitoring and Maintenance

### 1. Systemd Service Monitoring

```bash
# Check application status
sudo systemctl status powerback.service

# View application logs with colors
powerback-logs

# View recent logs (last 50 lines)
sudo journalctl -u powerback.service -n 50

# View logs from today
sudo journalctl -u powerback.service --since today

# View logs with timestamps
sudo journalctl -u powerback.service -f --no-pager -o short-iso
```

### 2. Secure Deployment Script

```bash
# Deploy with fresh secrets (copies secrets, restarts, deletes temp file)
launch

# Or use the full path
/usr/local/bin/launch-powerback
```

### 3. NGINX Monitoring

```bash
# Check NGINX status
sudo systemctl status nginx

# Test NGINX configuration
sudo nginx -t

# Reload NGINX configuration
sudo systemctl reload nginx

# View NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 4. Service Management Commands

```bash
# Start the Powerback service
sudo systemctl start powerback.service

# Stop the Powerback service
sudo systemctl stop powerback.service

# Restart the Powerback service
sudo systemctl restart powerback.service

# Enable service to start on boot
sudo systemctl enable powerback.service

# Disable service from starting on boot
sudo systemctl disable powerback.service
```

## Troubleshooting

### Common Issues

1. **Application not starting:**

   ```bash
   # Check service status
   sudo systemctl status powerback.service

   # Check logs for errors
   sudo journalctl -u powerback.service --since "5 minutes ago"

   # Check if environment file exists
   ls -la /etc/powerback/powerback.env
   ```

2. **Environment variables not loading:**

   ```bash
   # Check if secrets file exists
   ls -la /etc/powerback/secrets/powerback.env

   # Run deployment script to copy secrets
   launch

   # Check if service is running
   sudo systemctl status powerback.service
   ```

3. **NGINX 502 errors:**

   ```bash
   # Check if application is running
   sudo netstat -tlnp | grep :2512

   # Check NGINX configuration
   sudo nginx -t

   # Check service status
   sudo systemctl status powerback.service
   ```

4. **Email not working:**

   ```bash
   # Check if environment variables are loaded
   sudo journalctl -u powerback.service --since "5 minutes ago" | grep -i "environment"

   # Test email connection
   node scripts/tests/test-email-templates.js <you@example.com>
   ```

5. **SSL certificate errors:**
   - Ensure certificate includes all required domains
   - Check certificate expiration
   - Use TLS bypass for email if needed

### Service Management

```bash
# Restart service with fresh secrets
launch

# Check service status
sudo systemctl status powerback.service

# View live logs
powerback-logs

# Check if port is listening
sudo netstat -tlnp | grep :2512
```

## GitHub Actions CI/CD Deployment

The project uses GitHub Actions for automated CI/CD deployment. The workflow automatically tests, builds, and deploys to production when code is pushed to `beta` or `main` branches.

### Workflow Overview

The CI/CD pipeline (`.github/workflows/ci_cd.yml`) consists of two jobs:

1. **Test Job**: Runs tests, builds the frontend, and performs smoke tests
2. **Deploy Job**: Syncs code to server, deploys frontend, installs dependencies, and restarts services

### Prerequisites

- GitHub repository with Actions enabled
- SSH access configured on production server
- GitHub Secrets configured (see below)

### Required GitHub Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name             | Description                                    | Example Value                            |
| ----------------------- | ---------------------------------------------- | ---------------------------------------- |
| `PROD_SSH_KEY`          | Private SSH key for server access              | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PROD_SSH_KNOWN_HOSTS`  | SSH known_hosts entry for server               | `[hostname] ssh-ed25519 ...`             |
| `PROD_SSH_PORT`         | SSH port number                                | `22`                                     |
| `PROD_SSH_USER`         | SSH username                                   | `deploy`                                 |
| `PROD_SSH_HOST`         | Production server hostname/IP                  | `powerback.us`                           |
| `PROD_APP_PATH`         | Application directory on server                | `/opt/powerback/app`                     |
| `PROD_PUBLIC_HTML_PATH` | Public HTML directory (nginx serves from here) | `/home/deploy/public_html`               |
| `PROD_DEPLOY_LOG_PATH`  | Deployment log file path                       | `/var/log/powerback/deploy.log`          |
| `PROD_WRAPPER_SCRIPT`   | SSH wrapper script path                        | `/home/deploy/bin/gh-actions-wrapper.sh` |
| `PROD_URL`              | Production URL for smoke tests                 | `https://powerback.us`                   |

### Workflow Triggers

The workflow runs automatically on:

- Push to `beta` branch
- Push to `main` branch
- Manual trigger via `workflow_dispatch`

### Deployment Process

1. **Test Phase**:
   - Checks out code
   - Installs dependencies (root and client)
   - Builds frontend with production settings
   - Runs smoke tests on build artifacts
   - Uploads build artifacts for deploy job

2. **Deploy Phase**:
   - Downloads frontend build artifacts
   - Configures SSH with provided keys
   - Syncs backend code to `${{ secrets.PROD_APP_PATH }}`
   - Deploys frontend build to `${{ secrets.PROD_PUBLIC_HTML_PATH }}`
   - Installs server dependencies via SSH wrapper (`pbnpminstall`)
   - Restarts services via SSH wrapper (`pbrestart`, `nginxreload`)
   - Runs post-deploy smoke tests against production URL

### SSH Wrapper Commands

The workflow uses restricted SSH commands via a wrapper script (`${{ secrets.PROD_WRAPPER_SCRIPT }}`). Required commands:

- `pbnpminstall` - Installs npm dependencies in app directory
- `pbrestart` - Restarts the powerback service
- `nginxreload` - Reloads nginx configuration
- `pbstatus` - (Optional) Checks service status
- `pbsecurity` - (Optional) Security score check
- `pbwhoami` - (Optional) Identity verification

### Troubleshooting GitHub Actions

1. **SSH Connection Failures**:
   - Verify `PROD_SSH_KEY` is correct and has proper permissions
   - Check `PROD_SSH_KNOWN_HOSTS` matches server fingerprint
   - Ensure SSH port is correct in `PROD_SSH_PORT`

2. **Deployment Failures**:
   - Check if paths in secrets match actual server paths
   - Verify wrapper script exists and has execute permissions
   - Check server logs: `sudo journalctl -u powerback.service -n 100`

3. **Build Failures**:
   - Review test job logs for compilation errors
   - Check if all dependencies are properly specified
   - Verify Node.js version compatibility

4. **Service Not Starting**:
   - Ensure `pbnpminstall` wrapper changes to correct directory (`${{ secrets.PROD_APP_PATH }}`)
   - Check systemd service file has correct `WorkingDirectory`
   - Verify dependencies were installed successfully

### Manual Deployment vs GitHub Actions

- **GitHub Actions**: Automated, runs on push, requires GitHub Secrets setup
- **Manual Deployment**: Full control, can be run locally, uses local SSH keys

Both methods deploy to the same production server and use the same deployment paths.

## Deployment Commands

### Secure Deployment

```bash
# Deploy with fresh secrets (copies secrets, restarts, deletes temp file)
launch

# Or use the full path
/usr/local/bin/launch-powerback
```

### Manual Deployment

```bash
# Build client
# Note: The prebuild hook automatically runs scripts/build/build-faq.js to generate
# FAQ JSON-LD schema and markdown documentation before building
cd client && npm run build && cd ..

# Copy secrets and restart service
sudo cp /etc/powerback/secrets/powerback.env /etc/powerback/powerback.env
sudo chmod 600 /etc/powerback/powerback.env
sudo chown fc:fc /etc/powerback/powerback.env
sudo systemctl restart powerback.service

# Delete temporary file for security
sudo rm /etc/powerback/powerback.env

# Reload NGINX
sudo systemctl reload nginx
```

### Testing Deployment

```bash
# Test API endpoint
curl -I -k https://powerback.us/api/sys/constants

# Test main site
curl -I -k https://powerback.us

# Check if port is listening
sudo netstat -tlnp | grep :2512
```

## Best Practices

1. **Always test in development first**
2. **Use secure environment variable management**
3. **Keep secrets in secure, isolated locations**
4. **Monitor application logs regularly with colored output**
5. **Use systemd for process management**
6. **Configure proper SSL certificates**
7. **Set up monitoring and alerting**
8. **Regular security updates**
9. **Use temporary file loading for secrets**
10. **Delete temporary secret files after loading**

## Support

For deployment issues:

- Check application logs: `powerback-logs`
- Check service status: `sudo systemctl status powerback.service`
- Check NGINX logs: `sudo tail -f /var/log/nginx/error.log`
- Test API endpoints: `curl -i https://powerback.us/api/sys/constants`
- Deploy with fresh secrets: `launch`

## Related Documentation

- [Deployment Automation](./deployment-automation.md) - CI/CD pipeline and automated deployment
- [Environment Management](./environment-management.md) - Environment configuration
- [Production Commands](./production-commands.md) - Production operation commands
- [Development Guide](./development.md) - Development setup
