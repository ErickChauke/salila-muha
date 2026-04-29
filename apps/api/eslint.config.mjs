import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    ignores: ['dist/**'],
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
