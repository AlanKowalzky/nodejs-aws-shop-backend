/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest', // Użyj ts-jest do transformacji plików TypeScript
  testEnvironment: 'node', // Środowisko testowe dla Node.js
  testMatch: [
    "**/test/**/*.test.ts" // Wzorzec dla plików testowych w folderze 'test'
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  verbose: true // Wyświetl szczegółowe informacje o przebiegu testów
};