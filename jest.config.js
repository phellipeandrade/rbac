const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset({tsconfig: '<rootDir>/tsconfig.base.json'}).transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  collectCoverage: true,
  collectCoverageFrom: ["packages/*/src/**/*.{ts,tsx}", "!packages/**/*.d.ts"],
  coverageDirectory: "coverage",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
};
