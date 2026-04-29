import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { SeedConstruct } from '../../lib/constructs/seed';

describe('SeedConstruct', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const table = new dynamodb.Table(stack, 'Table', {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }
    });

    const bucket = new s3.Bucket(stack, 'Bucket');
    const bedrockPolicyStatement = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['mock-resource']
    });

    new SeedConstruct(stack, 'Seed', { table, faissIndexBucket: bucket, bedrockPolicyStatement, forceDockerBundling: false });
    template = Template.fromStack(stack);
  });

  it('creates the seed Lambda with correct configuration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Description: 'SeedHandler',
      Runtime: 'nodejs22.x',
      Timeout: 300
    });
  });

  it('grants DynamoDB write access to the seed Lambda', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['dynamodb:PutItem']),
            Effect: 'Allow'
          })
        ])
      }
    });
  });

  it('grants S3 put access to the seed Lambda', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['s3:PutObject']),
            Effect: 'Allow'
          })
        ])
      }
    });
  });

  it('grants Bedrock access to the seed Lambda', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'bedrock:InvokeModel',
            Effect: 'Allow'
          })
        ])
      }
    });
  });

  it('creates the custom resource', () => {
    template.resourceCountIs('AWS::CloudFormation::CustomResource', 1);
  });
});
