/**
 * @fileoverview Annotation audit script for POWERBACK codebase
 *
 * This script systematically audits all code files to determine:
 * 1. Which files should be annotated based on codebase patterns
 * 2. Current annotation status
 * 3. Annotation quality and completeness
 * 4. Outliers and inconsistencies
 * 5. Outdated annotations
 */

const fs = require('fs');
const path = require('path');

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'client/public',
  '__tests__',
  'tests',
  'tests-examples',
  'snapshots',
  '.eslint',
];

// File extensions to audit
const CODE_EXTENSIONS = ['.js', '.ts', '.tsx'];

// Patterns to identify annotation
const ANNOTATION_PATTERNS = {
  fileHeader: /@fileoverview|@module|@file/,
  functionDoc: /@param|@returns|@throws|@example/,
  classDoc: /@class|@extends|@constructor/,
};

/**
 * Check if file should be excluded from audit
 */
function shouldExclude(filePath) {
  return EXCLUDE_DIRS.some((dir) => filePath.includes(dir));
}

/**
 * Get file type category
 */
function getFileCategory(filePath) {
  if (filePath.includes('/routes/')) return 'route';
  if (filePath.includes('/controller/')) return 'controller';
  if (filePath.includes('/services/')) return 'service';
  if (filePath.includes('/models/')) return 'model';
  if (filePath.includes('/auth/')) return 'auth';
  if (filePath.includes('/validation/')) return 'validation';
  if (filePath.includes('/jobs/')) return 'job';
  if (filePath.includes('/client/src/components/')) return 'component';
  if (filePath.includes('/client/src/hooks/')) return 'hook';
  if (filePath.includes('/client/src/pages/')) return 'page';
  if (filePath.includes('/client/src/api/')) return 'api';
  if (filePath.includes('/client/src/contexts/')) return 'context';
  if (filePath.includes('/client/src/utils/')) return 'utility';
  if (filePath.includes('/client/src/types/')) return 'type';
  if (filePath.includes('/client/src/interfaces/')) return 'interface';
  if (filePath.includes('/scripts/')) return 'script';
  if (filePath.includes('/constants/')) return 'constant';
  return 'other';
}

/**
 * Analyze file for annotations
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const first50Lines = lines.slice(0, 50).join('\n');

  const hasFileHeader = ANNOTATION_PATTERNS.fileHeader.test(first50Lines);
  const hasFunctionDoc = ANNOTATION_PATTERNS.functionDoc.test(content);
  const hasClassDoc = ANNOTATION_PATTERNS.classDoc.test(content);

  // Count functions/classes
  const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\(|const\s+\w+\s*=\s*(async\s+)?\(/g) || [];
  const classMatches = content.match(/class\s+\w+/g) || [];
  const totalItems = functionMatches.length + classMatches.length;

  // Count documented items
  const documentedItems = (content.match(/@param|@returns/g) || []).length;

  const category = getFileCategory(filePath);
  const extension = path.extname(filePath);
  const isBackend = !filePath.includes('/client/');
  const isFrontend = filePath.includes('/client/');

  return {
    path: filePath,
    category,
    extension,
    isBackend,
    isFrontend,
    hasFileHeader,
    hasFunctionDoc,
    hasClassDoc,
    totalItems,
    documentedItems,
    coverage: totalItems > 0 ? (documentedItems / totalItems) * 100 : 0,
    lineCount: lines.length,
  };
}

/**
 * Get all code files recursively
 */
function getAllCodeFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!shouldExclude(filePath)) {
        getAllCodeFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (CODE_EXTENSIONS.includes(ext) && !shouldExclude(filePath)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Group files by category
 */
function groupByCategory(files) {
  const grouped = {};
  files.forEach((file) => {
    const category = file.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(file);
  });
  return grouped;
}

/**
 * Calculate statistics
 */
function calculateStats(files) {
  const total = files.length;
  const withHeader = files.filter((f) => f.hasFileHeader).length;
  const withFunctionDoc = files.filter((f) => f.hasFunctionDoc).length;
  const avgCoverage =
    files.reduce((sum, f) => sum + f.coverage, 0) / total || 0;

  return {
    total,
    withHeader,
    withFunctionDoc,
    headerPercentage: (withHeader / total) * 100,
    functionDocPercentage: (withFunctionDoc / total) * 100,
    avgCoverage,
  };
}

/**
 * Main audit function
 */
function audit() {
  const rootDir = path.join(__dirname, '..');
  const files = getAllCodeFiles(rootDir);
  const analyzed = files.map(analyzeFile);
  const grouped = groupByCategory(analyzed);
  const stats = calculateStats(analyzed);

  // Find outliers (files that should be annotated but aren't)
  const outliers = analyzed.filter((file) => {
    // Routes, controllers, services, models should have headers
    const shouldHaveHeader = ['route', 'controller', 'service', 'model', 'auth'].includes(
      file.category
    );
    return shouldHaveHeader && !file.hasFileHeader;
  });

  // Find files with low documentation coverage
  const lowCoverage = analyzed.filter(
    (file) => file.totalItems > 3 && file.coverage < 50
  );

  // Generate report
  const report = {
    summary: stats,
    byCategory: Object.keys(grouped).map((category) => ({
      category,
      count: grouped[category].length,
      stats: calculateStats(grouped[category]),
    })),
    outliers: {
      missingHeaders: outliers.map((f) => ({
        path: f.path,
        category: f.category,
      })),
      lowCoverage: lowCoverage
        .sort((a, b) => a.coverage - b.coverage)
        .slice(0, 50)
        .map((f) => ({
          path: f.path,
          category: f.category,
          coverage: f.coverage.toFixed(1),
          totalItems: f.totalItems,
        })),
    },
  };

  return report;
}

// Run audit if called directly
if (require.main === module) {
  const report = audit();
  console.log(JSON.stringify(report, null, 2));
}

module.exports = { audit, analyzeFile, getAllCodeFiles };
