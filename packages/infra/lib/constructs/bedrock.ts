import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class BedrockConstruct extends Construct {
  readonly policyStatement: iam.PolicyStatement;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.policyStatement = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: [
        'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
        'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v1',
      ],
    });
  }
}
