// jest.config.js - Testing runner configuration for TypeScript ESM files.

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Resolve .js extension suffixes to local TypeScript source files under ts-jest compilation rules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts'],
};
