module.exports = {
  // Environment globals for Node.js and ES2020.
  env: {
    node: true,
    es2020: true,
  },
  // Use the TypeScript ESLint parser.
  parser: '@typescript-eslint/parser',
  // Parser settings for modern syntax.
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  // Enable TypeScript-specific lint rules.
  plugins: ['@typescript-eslint'],
  // Base recommended rule sets.
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  // Project-specific overrides.
  rules: {},
};
