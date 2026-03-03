/**
 * Generates client/src/breakpoints.css from client/src/constants/breakpoints.js.
 * Run before start/build so CSS has current token values. Single source of truth: breakpoints.js.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const breakpointsPath = path.join(
  repoRoot,
  'client',
  'src',
  'constants',
  'breakpoints.js'
);
const outPath = path.join(repoRoot, 'client', 'src', 'breakpoints.css');

delete require.cache[require.resolve(breakpointsPath)];
const { BREAKPOINTS, HEIGHT } = require(breakpointsPath);

const lines = [
  '/* Auto-generated from client/src/constants/breakpoints.js. Do not edit. */',
  '/* In @media use these values as literal px (no var()); see docs/design-system.md. */',
  ':root {',
  '  /* Width (APP.BREAKPOINTS) */',
  ...Object.entries(BREAKPOINTS).map(
    ([key, val]) => `  --bp-${key}: ${val}px;`
  ),
  '  /* Height (APP.HEIGHT) */',
  ...Object.entries(HEIGHT).map(
    ([key, val]) =>
      `  --height-${key
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')}: ${val}px;`
  ),
  '}',
  '',
];

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
