import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/app', '<rootDir>/src'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  passWithNoTests: true,
};

export default config;
