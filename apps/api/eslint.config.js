import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**'],
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
