import type { Config } from 'jest';
import baseConfig from '../../jest.config.base';

const config: Config = {
  ...baseConfig,
  collectCoverageFrom: ['lib/**/*.ts', '!lib/**/*.d.ts'],
};

export default config;
