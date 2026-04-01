import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/packages/shared',
    '<rootDir>/packages/infra',
    '<rootDir>/packages/api',
    '<rootDir>/packages/web',
  ],
};

export default config;
