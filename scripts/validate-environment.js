#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 *
 * Validates that required environment variables are set before starting the application.
 * Checks for .env.local file existence and required variables in development.
 * Validates from process.env in production (loaded from systemd + SECRETS_PATH).
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env.local');
const examplePath = path.join(rootDir, '.env.example.backend');

// Required environment variables (critical for app to function)
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'SESSION_SECRET',
];

// Important environment variables (app may work but with limited functionality)
const importantVars = [
  'NODE_ENV',
  'PORT',
  'GOOGLE_CIVICS_API_KEY',
  'CONGRESS_GOV_API_KEY',
  'FEC_API_KEY',
  'STRIPE_SIGNING_SECRET_CLI',
  'STRIPE_SIGNING_SECRET_WORKBENCH',
  'EMAIL_JONATHAN_PASS',
  'EMAIL_SUPPORT_PASS',
  'EMAIL_OUTREACH_PASS',
  'EMAIL_CONTRIBUTORS_PASS',
  'EMAIL_INFO_NOREPLY_PASS',
  'EMAIL_ALERTS_NOREPLY_PASS',
  'EMAIL_ERROR_REPORTER_PASS',
  'EMAIL_ACCOUNT_SECURITY_NOREPLY_PASS',
  'SMTP_HOST',
];

function checkEnvFile() {
  // In production, environment variables come from systemd service + SECRETS_PATH
  // Skip .env file check in production
  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found');
    console.error(`   Expected location: ${envPath}`);
    console.error('\n📋 To fix this:');
    if (fs.existsSync(examplePath)) {
      console.error(
        `   1. Copy the template: cp .env.example.backend .env.local`
      );
    } else {
      console.error('   1. Create a .env.local file in the project root');
    }
    console.error(
      '   2. Fill in your actual values (replace "replace_me" placeholders)'
    );
    return false;
  }
  return true;
}

function loadEnvFile() {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        if (key && value) {
          envVars[key] = value;
        }
      }
    }
  });

  return envVars;
}

function validateEnvVars() {
  if (!checkEnvFile()) {
    process.exit(1);
  }

  let envVars;

  // In production, validate from process.env (loaded from systemd + SECRETS_PATH)
  // In development, validate from .env.local file
  if (process.env.NODE_ENV === 'production') {
    envVars = process.env;
  } else {
    envVars = loadEnvFile();
  }

  const missingRequired = [];
  const missingImportant = [];

  // Check required variables
  requiredVars.forEach((varName) => {
    if (!envVars[varName] || envVars[varName].trim() === '') {
      missingRequired.push(varName);
    }
  });

  // Check important variables
  importantVars.forEach((varName) => {
    if (!envVars[varName] || envVars[varName].trim() === '') {
      missingImportant.push(varName);
    }
  });

  // Report results
  if (missingRequired.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingRequired.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      '\n⚠️  The application will not start without these variables.'
    );
    process.exit(1);
  }

  if (missingImportant.length > 0) {
    console.warn('⚠️  Missing important environment variables:');
    missingImportant.forEach((varName) => {
      console.warn(`   - ${varName}`);
    });
    console.warn('\nThe app may run but with limited functionality.');
    console.warn(
      '   Consider adding these variables to your .env.local file.\n'
    );
  }

  if (missingRequired.length === 0 && missingImportant.length === 0) {
    const source =
      process.env.NODE_ENV === 'production'
        ? 'process.env (systemd + SECRETS_PATH)'
        : '.env.local file';
    console.log(
      `✅ All environment variables validated successfully (from ${source})`
    );
    return true;
  }

  return missingRequired.length === 0;
}

// Run validation
if (require.main === module) {
  validateEnvVars();
}

module.exports = { validateEnvVars, checkEnvFile, loadEnvFile };
