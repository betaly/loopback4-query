module.exports = {
  extends: ['@nutol/eslint-config/eslintrc.js', 'plugin:prettier/recommended'],
  plugins: ['import', 'simple-import-sort', 'prettier'],
  overrides: [
    {
      files: ['**/*.ts'],
      rules: {
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
        '@typescript-eslint/naming-convention': 'off',
      },
    },
  ],
};
