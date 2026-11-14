import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['lib/**', 'coverage/**', 'node_modules/**', 'test/**', 'examples/**', 'benchmarks/**'] },
  {
    files: ['src/**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { parserOptions: { ecmaVersion: 'latest' } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },
  { files: ['src/adapters/driver-utils.ts'], rules: { '@typescript-eslint/no-require-imports': 'off' } }
);
