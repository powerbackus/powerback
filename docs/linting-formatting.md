# Linting and Formatting Guide

This document explains the linting and formatting setup for the POWERBACK codebase, including ESLint configuration, formatting rules, and IDE setup instructions.

## Overview

The project uses **ESLint** for both linting and code formatting. This provides a unified tool for code quality and style consistency across JavaScript, TypeScript, JSX, and TSX files.

### Key Features

- **Single tool**: ESLint handles both linting and formatting (no Prettier)
- **TypeScript support**: Separate parser configuration for `.ts` and `.tsx` files
- **Custom rules**: Project-specific rules for React hooks and import ordering
- **Auto-fixable**: Most formatting issues can be automatically fixed
- **IDE integration**: Works with VS Code, Cursor, and other editors

## Quick Start

### Format All Files

```bash
# Format all JS/JSX/TS/TSX files
npm run format

# Check formatting without fixing
npm run format:check
```

### Lint Files

```bash
# Lint all files
npm run lint

# Lint and auto-fix issues
npm run lint:fix
```

## Configuration Files

### ESLint Configuration

- **Location**: `.eslintrc.js` (root directory)
- **Custom rules**: `.eslint/local.js` and `.eslint/use-effect-cleanup-function.js`

### TypeScript Configuration

- **Location**: `client/src/tsconfig.json`
- **Used by**: ESLint TypeScript parser for type-aware linting

## Formatting Rules

The ESLint configuration enforces consistent code style across the codebase. Key formatting rules include:

### Quotes

- **Strings**: Single quotes (`'string'`)
- **JSX attributes**: Single quotes (`<div className='container'>`)
- **Template literals**: Allowed when needed (`\`template\``)

### Indentation

- **Spaces**: 2 spaces (no tabs)
- **Switch cases**: Indented by 1 level
- **Continuations**: Consistent indentation for multi-line statements

### Semicolons

- **Required**: Always use semicolons
- **Spacing**: No space before, one space after

### Line Length

- **Maximum**: 100 characters (warning, not error)
- **Exceptions**: URLs, strings, template literals, regex, comments

### Spacing

- **Operators**: Spaces around operators (`a + b`)
- **Commas**: No space before, space after (`[a, b, c]`)
- **Objects**: Spaces in object literals (`{ key: value }`)
- **Parentheses**: No spaces inside (`if (condition)`)
- **Functions**: Space before function parentheses (except named functions)

### Trailing Commas

- **Style**: ES5 style (multiline only)
- **Applies to**: Arrays, objects, imports, exports, functions

### Arrow Functions

- **Parentheses**: Always required (`(x) => x`)
- **Spacing**: Space before and after arrow (`(x) => x`)

### Object Formatting

- **Shorthand**: Use object shorthand when possible (`{ name }` instead of `{ name: name }`)
- **Quote props**: Only quote object keys when necessary

### Brace Style

- **Style**: 1TBS (one true brace style)
- **Single line**: Allowed for short blocks

### Other Formatting

- **End of file**: Newline at end of file
- **Empty lines**: Maximum 2 consecutive empty lines, 1 at end of file
- **Trailing spaces**: Not allowed
- **Padded blocks**: No padding inside blocks

## TypeScript-Specific Rules

TypeScript files (`.ts`, `.tsx`) use the `@typescript-eslint/parser` with additional formatting rules:

- **Indentation**: TypeScript-aware indentation with proper handling of type annotations
- **Type formatting**: Proper spacing in union types, intersection types, and generics
- **No `any` in new code**: New TypeScript in `client/src` should use concrete types instead of `any`. Existing `any` usages have been removed from core entry points (see `fix/no-any` changelog); any new `any` should be treated as technical debt with a follow-up task.

## Custom Rules

### Import Ordering

The project enforces a specific import order:

1. Node built-in modules (`fs`, `path`)
2. External npm packages (`react`, `axios`)
3. Internal absolute imports (`@/**` aliases)
4. Parent directory imports (`../`)
5. Sibling imports (`./`)
6. Index imports (`./index`)

**Newlines**: Blank lines between import groups

### useEffect Cleanup Function

Custom rule that enforces `useEffect` cleanup functions must return a function:

```typescript
// Good
useEffect(() => {
  const timer = setTimeout(() => {}, 1000);
  return () => clearTimeout(timer);
}, []);

// Bad - cleanup must be a function
useEffect(() => {
  return null; // Error: cleanup must be a function
}, []);
```

## IDE Setup

### VS Code / Cursor

To enable ESLint formatting in your IDE:

1. **Install ESLint extension**:
   - VS Code: Install "ESLint" by Microsoft
   - Cursor: Install "ESLint" extension

2. **Configure as default formatter** (optional):

   ```json
   {
     "[javascript]": {
       "editor.defaultFormatter": "dbaeumer.vscode-eslint",
       "editor.formatOnSave": true
     },
     "[javascriptreact]": {
       "editor.defaultFormatter": "dbaeumer.vscode-eslint",
       "editor.formatOnSave": true
     },
     "[typescript]": {
       "editor.defaultFormatter": "dbaeumer.vscode-eslint",
       "editor.formatOnSave": true
     },
     "[typescriptreact]": {
       "editor.defaultFormatter": "dbaeumer.vscode-eslint",
       "editor.formatOnSave": true
     }
   }
   ```

3. **Format Document**:
   - Use "Format Document" command (Shift+Alt+F / Shift+Option+F)
   - Or right-click → "Format Document"
   - ESLint will format the file according to configured rules

### Other Editors

- **WebStorm/IntelliJ**: ESLint plugin with auto-fix on save
- **Sublime Text**: ESLint package with format on save
- **Vim/Neovim**: Use ALE or coc-eslint

## File Type Support

### Supported by ESLint

- ✅ JavaScript (`.js`)
- ✅ JavaScript React (`.jsx`)
- ✅ TypeScript (`.ts`)
- ✅ TypeScript React (`.tsx`)

### Not Supported by ESLint

These file types require separate formatters:

- **CSS**: Use built-in CSS formatter or Stylelint (see `npm-scripts.md` for `lint:css`)
- **HTML**: Use built-in HTML formatter
- **JSON**: Use built-in JSON formatter

## NPM Scripts

See [NPM Scripts Catalog](./npm-scripts.md) for complete script documentation.

| Script         | Command                                  | Description                     |
| -------------- | ---------------------------------------- | ------------------------------- |
| `lint`         | `eslint . --ext .js,.jsx,.ts,.tsx`       | Lint all JS/TS files            |
| `lint:fix`     | `eslint . --ext .js,.jsx,.ts,.tsx --fix` | Lint and auto-fix issues        |
| `format`       | `eslint . --ext .js,.jsx,.ts,.tsx --fix` | Format all JS/TS files          |
| `format:check` | `eslint . --ext .js,.jsx,.ts,.tsx`       | Check formatting without fixing |

## Troubleshooting

### ESLint Not Formatting

1. **Check extension**: Ensure ESLint extension is installed and enabled
2. **Check config**: Verify `.eslintrc.js` exists and is valid
3. **Restart IDE**: Restart your editor after configuration changes
4. **Check output**: Look at ESLint output panel for errors

### TypeScript Parser Errors

If you see TypeScript parser errors:

1. **Check tsconfig**: Verify `client/src/tsconfig.json` exists
2. **Check project**: Ensure TypeScript project is properly configured
3. **Check dependencies**: Run `npm install` to ensure all packages are installed

### Formatting Conflicts

If formatting conflicts occur:

1. **Run format**: `npm run format` to format entire codebase
2. **Check rules**: Review `.eslintrc.js` for conflicting rules
3. **Clear cache**: Delete `.eslintcache` and restart

### Import Order Issues

If imports are not being ordered correctly:

1. **Check groups**: Verify import groups match the configuration
2. **Run lint:fix**: `npm run lint:fix` will reorder imports
3. **Manual fix**: Follow the import order rules manually if needed

## Best Practices

1. **Format before commit**: Run `npm run format` before committing code
2. **Use IDE integration**: Enable format on save for automatic formatting
3. **Check CI**: Ensure CI runs `npm run format:check` to catch formatting issues
4. **Consistent style**: Follow the established formatting rules consistently
5. **Review changes**: Review auto-formatted changes to ensure they're correct

## Related Documentation

- [Code Style Guidelines](../.cursor/rules/17-code-style.mdc) - Detailed code style patterns
- [NPM Scripts](./npm-scripts.md) - Complete script catalog
- [Development Guide](./development.md) - Development setup instructions
- [CSS Organization](./css-organization.md) - CSS linting and organization
