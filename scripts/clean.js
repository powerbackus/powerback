const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Clean script for removing build artifacts and temporary files
 * Cross-platform compatible with proper wildcard handling
 */

const patterns = [
  // Build directories
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',

  // Cache directories
  '.cache',
  '.parcel-cache',
  '.rpt2_cache',
  '.rts2_cache_cjs',
  '.rts2_cache_es',
  '.rts2_cache_umd',
  '.temp',
  '.docusaurus',
  '.serverless',
  '.fusebox',
  '.dynamodb',
  '.tern-port',
  '.vscode-test',
  '.yarn',
  '.eslintcache',
  '.stylelintcache',
  '.grunt',
  '.lock-wscript',
  '.yarn-integrity',
  '.node_repl_history',
  'pids',
  'lib-cov',
  'coverage',
  '.nyc_output',

  // File patterns (will be handled by rimraf with glob support)
  '*.tsbuildinfo',
  '*.lcov',
  '*.tgz',
  '*.pid',
  '*.seed',
  '*.pid.lock',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  'lerna-debug.log*',
  '.pnpm-debug.log*',
  'report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json',
  'logs/*.log',
];

function cleanDirectory(dir) {
  console.log(`Cleaning ${dir}...`);

  patterns.forEach((pattern) => {
    try {
      const fullPath = path.join(dir, pattern);
      if (fs.existsSync(fullPath)) {
        console.log(`  Removing: ${pattern}`);
        execSync(`rimraf "${fullPath}"`, { stdio: 'inherit' });
      }
    } catch (error) {
      // Ignore errors for non-existent files
    }
  });
}

// Clean root directory
console.log('🧹 Cleaning project...');
cleanDirectory('.');

// Clean client directory if it exists
const clientDir = path.join('.', 'client');
if (fs.existsSync(clientDir)) {
  console.log('\n🧹 Cleaning client directory...');
  cleanDirectory(clientDir);
}

console.log('\n✅ Clean complete!');
