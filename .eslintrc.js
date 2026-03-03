/**
 * ESLint: logic and import order only. Formatting is handled by Prettier.
 * eslint-config-prettier (in extends) disables formatting rules; we do not re-enable them.
 */
module.exports = {
  plugins: ['import'],
  rules: {
    'no-undef': 'error',
    'import/no-unresolved': 'error',
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        'newlines-between': 'ignore',
      },
    ],
  },
  settings: {
    import: {
      parsers: {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      resolver: {
        typescript: {
          alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
          // Choose from one of the "project" configs below or omit to use <root>/tsconfig.json by default
          // use <root>/path/to/folder/tsconfig.json
          project: ['client/src/tsconfig.json'],
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    react: {
      version: 'detect',
    },
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  env: {
    es6: true,
  },
  extends: ['react-app', 'react-app/jest', 'prettier'],
  overrides: [
    {
      files: ['client/src/**/*.ts', 'client/src/**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: ['./client/src/tsconfig.json'],
      },
      plugins: ['@typescript-eslint'],
    },
  ],
};
