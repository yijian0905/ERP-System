module.exports = {
  extends: ['../config/eslint/node.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};

