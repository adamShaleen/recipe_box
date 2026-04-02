import * as cdk from 'aws-cdk-lib';
import { BedrockConstruct } from '../../lib/constructs/bedrock';

describe('BedrockConstruct', () => {
  it('exposes a policy statement with bedrock:InvokeModel', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const construct = new BedrockConstruct(stack, 'Bedrock');
    const statement = construct.policyStatement.toStatementJson();

    expect(statement.Action).toContain('bedrock:InvokeModel');
    expect(statement.Resource).toContain(
      'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
    );
    expect(statement.Resource).toContain(
      'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1'
    );
    expect(statement.Effect).toBe('Allow');
  });
});
