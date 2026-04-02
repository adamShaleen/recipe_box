import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { RecipeBoxStack } from '../lib/recipe-box-stack';

describe('RecipeBoxStack', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new RecipeBoxStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  it('creates the DynamoDB table', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'recipes',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });

    template.hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Retain'
    });
  });

  it('creates the S3 bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }
        ]
      },
      VersioningConfiguration: Match.absent()
    });
  });

  it('creates the Lambda functions', () => {
    const lambdaResource = 'AWS::Lambda::Function';

    template.hasResourceProperties(lambdaResource, {
      Description: 'GetRecipes',
      Runtime: 'nodejs20.x'
    });

    template.hasResourceProperties(lambdaResource, {
      Description: 'GetRecipe',
      Runtime: 'nodejs20.x'
    });

    template.hasResourceProperties(lambdaResource, {
      Description: 'ModifyRecipe',
      Runtime: 'nodejs20.x'
    });
  });

  it('grants Bedrock access to the ModifyRecipe lambda', () => {
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

  it('grants S3 read access to the ModifyRecipe lambda', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith(['s3:GetObject*']),
            Effect: 'Allow'
          })
        ])
      }
    });
  });

  it('grants DynamoDB read access to all three lambdas', () => {
    const policies = template.findResources('AWS::IAM::Policy', {
      Properties: {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['dynamodb:Query']),
              Effect: 'Allow'
            })
          ])
        }
      }
    });

    expect(Object.keys(policies)).toHaveLength(3);
  });

  it('creates the API Gateway', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', { Name: 'recipe-box-api' });
  });

  it('creates the seed Lambda', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Description: 'SeedHandler',
      Runtime: 'nodejs20.x',
      Timeout: 300
    });
  });

  it('creates the seed custom resource', () => {
    template.resourceCountIs('AWS::CloudFormation::CustomResource', 1);
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
});
