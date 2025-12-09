module.exports = {
  extends: ['../../packages/config/eslint/node.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};

