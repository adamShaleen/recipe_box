import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { ApiConstruct } from '../../lib/constructs/api';

describe('ApiConstruct', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    const table = new dynamodb.Table(stack, 'Table', {
      partitionKey: { name: 'mock-partition-key', type: dynamodb.AttributeType.STRING }
    });

    const bucket = new s3.Bucket(stack, 'Bucket');
    const policyStatement = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel'],
      resources: ['mock-resource-1', 'mock-resource-2']
    });

    new ApiConstruct(stack, 'Api', {
      table,
      faissIndexBucket: bucket,
      bedrockPolicyStatement: policyStatement
    });

    template = Template.fromStack(stack);
  });

  it('creates get all, get by, and modify lambdas', () => {
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

  it('creates the ApiGateway Rest API', () => {
    const restApiResource = 'AWS::ApiGateway::RestApi';

    template.resourceCountIs(restApiResource, 1);
    template.hasResourceProperties(restApiResource, { Name: 'recipe-box-api' });
  });

  it('correctly configures Integration', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      Integration: {
        IntegrationResponses: [
          {
            ResponseParameters: {
              'method.response.header.Access-Control-Allow-Headers': "'Content-Type,x-api-key'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Methods':
                "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'"
            }
          }
        ]
      }
    });
  });
});
