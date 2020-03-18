module.exports = {
  root: true,
  env: {
    es6: true,
    browser: true,
    jquery: true
  },
  globals: {
    'monaco': 'readonly'
  },
  extends: [
    'eslint:recommended'
  ],
  rules: {
    'no-trailing-spaces': 'error',
    'semi': 'error',
    'indent': ['error', 2],
    'no-trailing-spaces': 'error'
  }
};
