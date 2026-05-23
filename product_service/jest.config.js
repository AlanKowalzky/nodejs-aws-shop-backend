/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/catalogBatchProcess.test.ts'],
  forceExit: true,
};
