import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

export default [
  // Base recommended rules
  js.configs.recommended,

  // Configuration for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
        // eslint-disable-next-line no-undef
        tsconfigRootDir: import.meta.dirname || process.cwd(),
      },
      globals: {
        // Node.js globals
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      prettier: prettier,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // TypeScript recommended rules
      ...typescript.configs.recommended.rules,

      // Disable no-undef for TypeScript files since TypeScript handles this
      'no-undef': 'off',

      // Import plugin rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'warn',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',

      // Google style rules (key ones) - adjusted to avoid conflicts
      'max-len': ['error', { code: 120 }],
      quotes: ['error', 'single'],

      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'warn',

      // Your custom rules
      'prettier/prettier': 'error',
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
    },
  },

  // Configuration for JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    ignores: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Node.js globals
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      prettier: prettier,
    },
    rules: {
      // Import plugin rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',

      // Google style rules (key ones)
      indent: ['error', 2],
      'max-len': ['error', { code: 80 }],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',

      // Your custom rules
      'prettier/prettier': 'error',
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
    },
  },
];
