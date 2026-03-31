import type { APIGatewayProxyResult } from 'aws-lambda';

const corsHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
});

export const ok = (body: unknown): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: corsHeaders(),
  body: JSON.stringify(body),
});

export const badRequest = (message: string): APIGatewayProxyResult => ({
  statusCode: 400,
  headers: corsHeaders(),
  body: JSON.stringify({ error: 'BAD_REQUEST', message }),
});

export const unauthorized = (): APIGatewayProxyResult => ({
  statusCode: 401,
  headers: corsHeaders(),
  body: JSON.stringify({ error: 'UNAUTHORIZED', message: 'Invalid or missing API key' }),
});

export const notFound = (message: string): APIGatewayProxyResult => ({
  statusCode: 404,
  headers: corsHeaders(),
  body: JSON.stringify({ error: 'NOT_FOUND', message }),
});

export const internalError = (message: string): APIGatewayProxyResult => ({
  statusCode: 500,
  headers: corsHeaders(),
  body: JSON.stringify({ error: 'INTERNAL_ERROR', message }),
});
