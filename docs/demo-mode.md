# Demo Mode

Demo mode allows users to try the POWERBACK.us funnel without creating an account or making a payment. It's a guest-only experience that demonstrates the core donation flow.

## Overview

Demo mode is enabled automatically when the app is accessed via specific hostnames:

- **Production**: `demo.powerback.us`
- **Local development**: `demo.localhost`

The same production build serves both `powerback.us` and `demo.powerback.us`—demo mode is determined by the browser hostname at runtime, not by environment variables or build flags.

## Features

### Enabled in Demo Mode

- ✅ Full funnel flow (Lobby → Confirmation)
- ✅ Politician selection and donation amount selection
- ✅ Onboarding tours (Joyride)
- ✅ Demo-specific copy and preview messaging
- ✅ Mock donations stored in localStorage (`pb:demoDonations`)

### Disabled in Demo Mode

- ❌ Account creation and login/signup
- ❌ Payment processing (no Stripe integration)
- ❌ Profile, settings, and account management
- ❌ Social sharing buttons
- ❌ Contact Us section
- ❌ Email notifications
- ❌ Database writes (except localStorage for demo donations)
- ❌ FEC compliance validation

## Local Development

### Setting Up `demo.localhost`

1. **Add to `/etc/hosts`** (or equivalent on your OS):

   ```
   127.0.0.1  demo.localhost
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

3. **Access the demo**:
   - Open `http://demo.localhost:3000` in your browser
   - The app will automatically detect the hostname and enable demo mode

### Testing Demo Donations

Demo donations are stored in browser localStorage under the key `pb:demoDonations`. To reset demo state:

```javascript
// In browser console
localStorage.removeItem('pb:demoDonations');
```

## Production Setup

### DNS Configuration

Configure `demo.powerback.us` to point to the same server as `powerback.us`:

```dns
demo.powerback.us.  IN  CNAME  powerback.us.
```

Or use an A record pointing to the same IP address.

### Web Server Configuration

The web server (NGINX or equivalent) must serve the same static build and proxy `/api` to the Node backend for both the main site and the demo hostname.

**Important:** In NGINX, each `server { }` block has its own set of `location` directives. If you use a **separate** server block for `demo.powerback.us` (e.g. with its own `server_name demo.powerback.us`), that block must include its own `location /api` proxy. Requests to `https://demo.powerback.us/api/...` will not use the main site's `location /api`; without a matching location, they fall through to `location /` and `try_files` serves `index.html`, so the API returns HTML and the app (e.g. PolCarousel) fails.

**Option A – Single server block (all hostnames share config):**

```nginx
server {
    listen 443 ssl http2;
    server_name powerback.us www.powerback.us demo.powerback.us;
    root /path/to/client/build;
    index index.html;
    # SSL and other directives...

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Option B – Separate server block for demo (e.g. for noindex or different root):**

The block for `demo.powerback.us` must define `location /api` before `location /`. Use the same `proxy_pass` port as your main site (e.g. `3001`):

```nginx
server {
    server_name demo.powerback.us;
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    root /home/deploy/public_html;
    index index.html;
    add_header X-Robots-Tag "noindex, nofollow, nosnippet, noarchive" always;
    # SSL certificates and other directives...

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
    location ~* \.(js|css|png|webp|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

After editing NGINX config, test and reload (requires root):

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Or with `service`:

```bash
sudo nginx -t && sudo service nginx reload
```

### CORS Configuration

Demo origins are already configured in the codebase:

- `constants/server.js`: `https://demo.powerback.us` is in `allowedOrigins`
- `config/server.config.js`: Dynamic CORS callback allows hostnames starting with `demo.`

No additional CORS configuration is needed if these files are up to date.

## Implementation Details

### Client-Side Detection

Demo mode is detected in `client/src/demoMode.ts`:

```typescript
const DEMO_HOSTNAMES = ['demo.powerback.us', 'demo.localhost'];
export const isDemoMode =
  typeof window !== 'undefined' &&
  DEMO_HOSTNAMES.includes(window.location.hostname);
```

### Demo Donations

Demo donations are stored in localStorage as a cumulative list:

```typescript
interface DemoDonationEntry {
  pol_id: string;
  amount: number;
  polName: string;
  date: number;
}
```

The `appendDemoDonation()` function adds entries, and `getDemoDonationsByPol()` retrieves them for display in the Escrow section.

### UI Differences

- **Navigation**: Shows "DEMO MODE" label instead of account/login buttons
- **Confirmation Page**:
  - Demo CTA block at top explaining it's a preview
  - "Preview" badge and demo-specific copy
  - Social sharing and Contact Us hidden
  - Tip title always shows "consider" variant (never "thank you")
- **Lobby**: Same interface, but "Celebrate!" button skips payment and goes straight to Confirmation

## Troubleshooting

### Demo Mode Not Activating

1. **Check hostname**: Ensure you're accessing `demo.powerback.us` or `demo.localhost` (not `powerback.us`)
2. **Check browser console**: Look for any JavaScript errors
3. **Verify DNS**: `demo.powerback.us` should resolve to the production server
4. **Check web server**: Ensure the server block includes `demo.powerback.us` in `server_name`

### CORS Errors

If you see CORS errors when accessing `demo.powerback.us`:

1. Verify `https://demo.powerback.us` is in `constants/server.js` `allowedOrigins`
2. Check `config/server.config.js` dynamic CORS callback allows `demo.` hostnames
3. Restart the Node.js server after CORS changes

### API Returns HTML, 304, or PolCarousel Does Not Load

If `/api/congress` (or other `/api/*`) returns the SPA's HTML page instead of JSON, or the browser shows 304 and the app still fails:

1. **Separate demo server block:** Ensure the server block with `server_name demo.powerback.us` has its own `location /api { ... proxy_pass ... }` (see Web Server Configuration above). NGINX does not share locations between server blocks.
2. **Order:** Place `location /api` **before** `location /` in that block so `/api` requests are proxied, not served via `try_files`/`index.html`.
3. **Cache:** If you previously got HTML for `/api/congress`, the browser may have cached it. Disable cache in DevTools and reload, or use a private window; you should get 200 with a JSON array for `/api/congress`.

### Demo Donations Not Persisting

- Demo donations are stored in localStorage, so they're browser-specific
- Clearing browser data will reset demo donations
- Each browser/incognito session has its own demo donation state

## Related Documentation

- [Development Guide](./development.md) - Local development setup
- [Production Setup](./production-setup.md) - Production deployment
- [API Documentation](./API.md) - API endpoints (most disabled in demo)
