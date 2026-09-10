import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.mjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: { sourceType: 'module' },
    },
    rules: {
      // NestJS relies on decorator metadata and constructor parameter
      // properties, which these two rules would otherwise flag.
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      // Repositories and DTOs legitimately expose `any` from driver types.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
