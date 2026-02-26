# API Key Usage Guide

This guide provides instructions on how to apply for and use API keys for **POWERBACK's** third-party services, including Stripe, ProPublica Congress API, and Google Civics.

_This guide assumes you are following our [Development Setup Guide](./development.md)._ 

- [Stripe](#stripe-api-key)
- [FEC](#fec-api-key)
- [Congress.GOV](#congressgov-api-key)
- [Google Civics](#google-civics-api-key)

## Stripe API Key

### Applying for key

1. Visit the Stripe [website](https://stripe.com).

2. Sign up for a Stripe account if you don't already have one.

3. Log in to your Stripe dashboard.

4. Navigate to the API section in your dashboard.

5. Create a new API key and specify its permissions. Be sure to select payment processing as a required permissions.

6. Note down any the generated API keys for use in your **POWERBACK** environment. Keep these safe.

### Using your key

1. Open your **POWERBACK** project.

2. Edit your `.env` file in the project root.

3. Set the Stripe environment variables:
   ```env
   # For development (test keys)
   STRIPE_PK_TEST=pk_test_...
   STRIPE_SK_TEST=sk_test_...
   STRIPE_SIGNING_SECRET_CLI=whsec_...
   
   # For production (live keys)
   STRIPE_PK_LIVE=pk_live_...
   STRIPE_SK_LIVE=sk_live_...
   STRIPE_SIGNING_SECRET_WORKBENCH=whsec_...
   ```

4. Save the changes and restart your **POWERBACK** server to apply the new API keys.

**Note**: Stripe public keys are loaded at runtime from the server via `/api/config/stripe-key` endpoint, so you don't need to hardcode them in client files. The system automatically uses test keys in development and live keys in production based on `NODE_ENV`.

## FEC API Key

### Applying for key

1. Visit the Federal Election Commission (FEC) API [website](https://api.open.fec.gov/developers/).

2. Sign up for an FEC account if required.

3. Request an API key from the FEC for access to campaign finance data. Follow the provided instructions to obtain your key.

4. Note down the generated API key for use in your **POWERBACK** environment.

5. Refer to the FEC API [documentation](https://api.open.fec.gov/developers/).

### Using your key

1. Open your **POWERBACK** project.

2. Edit your `.env` file in the project root.

3. Set the `FEC_API_KEY` environment variable with your FEC API key:
   ```env
   FEC_API_KEY=your-api-key-here
   ```

4. Save the changes and restart your **POWERBACK** server to apply the new API key.

## Congress.GOV API Key

### Applying for key

1. Visit the Congress.GOV API [website](https://api.congress.gov/).

2. Sign up for a Congress.GOV account if required.

3. Request an API key from Congress.GOV for access to legislative data. Follow the provided instructions to obtain your key.

4. Note down the generated API key for use in your **POWERBACK** environment.

5. Refer to the Congress.GOV API [documentation](https://api.congress.gov/).

### Using your key

1. Open your **POWERBACK** project.

2. Edit your `.env` file in the project root.

3. Set the `CONGRESS_GOV_API_KEY` environment variable with your Congress.GOV API key:
   ```env
   CONGRESS_GOV_API_KEY=your-api-key-here
   ```

4. Save the changes and restart your **POWERBACK** server to apply the new API key.

## Google Civics API Key

### Applying for key

1. Go to the [Google Cloud Console APIs & Services page](https://console.cloud.google.com/apis/).

2. Sign in with your Google account or create one if you don't have an account.

3. Click on **Credentials** in the left sidebar.

4. Create a new API key by clicking on the **Create credentials** button and selecting **API key**, or select an existing API key.

5. If you're creating a new key, note down the generated API key. You'll need this key to access the Google Civics API.

6. Ensure the Google Civics Information API is enabled for your project:
   - Navigate to **APIs & Services** > **Library**
   - Search for "Google Civics Information API" and enable it if not already enabled

### IP Allowlist Configuration (Optional but Recommended)

For enhanced security, you can configure IP address restrictions on your API key:

1. In the Google Cloud Console, go to **APIs & Services** > **Credentials**.

2. Click on your API key to edit it.

3. Under **API restrictions**, you can restrict which APIs the key can access.

4. Under **Application restrictions**, select **IP addresses (web servers, cron jobs, etc.)**.

5. Add your IP addresses to the allowlist:
   - **For development environments**: Add your local development machine's public IP address. If your IP changes, you'll need to update the allowlist.
   - **For production environments**: Add your production server's IP address(es).

6. Save your changes.

**Note**: If you set up IP restrictions, any requests from IPs not on the allowlist will be rejected. This is how the project maintainer has configured their setup for security, but you can choose to skip IP restrictions if you prefer a less strict configuration.

### Using your key

1. Open your **POWERBACK** project.

2. Edit your `.env` file in the project root.

3. Set the `GOOGLE_CIVICS_API_KEY` environment variable with your Google Civics API key:
   ```env
   GOOGLE_CIVICS_API_KEY=your-api-key-here
   ```

4. Save the changes and restart your **POWERBACK** server to apply the new API key.

By following these instructions, you can apply for and use API keys for the third-party services needed to run **POWERBACK**. If you have any questions please reach out at [support@powerback.us](mailto:support@powerback.us).

Return to the [Development Setup Guide](./development.md).

## Related Documentation

- [Development Setup Guide](./development.md) - Complete setup instructions
- [Environment Management](./environment-management.md) - Environment configuration
- [API Documentation](./API.md) - API endpoints that use these keys
