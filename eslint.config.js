export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'automacao/node_modules/**',
      'automacao/evidencias/**',
      '**/*.min.js'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off'
    }
  },
  {
    files: ['automacao/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script'
    }
  }
];
