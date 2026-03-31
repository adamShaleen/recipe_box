import type {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceResponse,
} from 'aws-lambda';

export const handler = async (
  _event: CloudFormationCustomResourceEvent,
): Promise<CloudFormationCustomResourceResponse> => {
  throw new Error('Not implemented');
};
