import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getEnvVar } from '../utils/env';

export const validateApiKey = ({ headers }: APIGatewayProxyEvent): boolean => {
  return getEnvVar('API_KEY') === headers['x-api-key'];
};
