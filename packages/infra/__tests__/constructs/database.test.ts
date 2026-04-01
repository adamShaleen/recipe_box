import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DatabaseConstruct } from '../../lib/constructs/database';

describe('DatabaseConstruct', () => {
  let template: Template;
  const dynamoResource = 'AWS::DynamoDB::Table';

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    new DatabaseConstruct(stack, 'Database');
    template = Template.fromStack(stack);
  });

  it('creates exactly one DynamoDB table', () => {
    template.resourceCountIs(dynamoResource, 1);
  });

  it('creates the DynamoDB table with the correct properties', () => {
    template.hasResourceProperties(dynamoResource, {
      TableName: 'recipes',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST',
    });
  });

  it('has a RETAIN deletion policy', () => {
    template.hasResource(dynamoResource, {
      DeletionPolicy: 'Retain',
    });
  });
});
