import type { APIGatewayProxyEvent } from 'aws-lambda';

export const validateApiKey = (_event: APIGatewayProxyEvent): boolean => {
  throw new Error('Not implemented');
};
