import * as sut from '../middleware/auth';
import * as envUtils from '../utils/env';

describe('validateApiKey', () => {
  const getEnvVarSpy = jest.spyOn(envUtils, 'getEnvVar');

  it.each([
    ['env key matches event', 'mock-key-1', { headers: { 'x-api-key': 'mock-key-1' } }, true],
    ['mismatch key', 'mock-key-1', { headers: { 'x-api-key': 'mock-key-2' } }, false],
    ['missing header', 'mock-key-1', { headers: {} }, false]
  ])('%s', (_description, envKey, event, output) => {
    getEnvVarSpy.mockReturnValue(envKey);
    expect(sut.validateApiKey(event as any)).toEqual(output);
  });
});
