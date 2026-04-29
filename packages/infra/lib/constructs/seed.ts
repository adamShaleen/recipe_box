import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import * as path from 'path';

interface SeedConstructProps {
  table: dynamodb.Table;
  faissIndexBucket: s3.Bucket;
  bedrockPolicyStatement: iam.PolicyStatement;
  forceDockerBundling?: boolean;
}

export class SeedConstruct extends Construct {
  readonly handler: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: SeedConstructProps) {
    super(scope, id);

    this.handler = new lambdaNodejs.NodejsFunction(this, 'SeedHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      projectRoot: path.resolve(__dirname, '../../../..'),
      bundling: {
        nodeModules: ['faiss-node'],
        forceDockerBundling: props.forceDockerBundling ?? true,
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          // Copies recipes.json into the Lambda bundle so it's available at runtime
          // as a local file (no S3 read needed during seeding).
          afterBundling: (_inputDir, outputDir) => [
            `cp ${path.join(_inputDir, 'data/recipes.json')} ${outputDir}/recipes.json`
          ]
        }
      },
      description: 'SeedHandler',
      entry: path.resolve(__dirname, '../seed/seed-handler.ts'),
      handler: 'handler',
      environment: {
        TABLE_NAME: props.table.tableName,
        FAISS_BUCKET: props.faissIndexBucket.bucketName
      }
    });

    props.table.grantWriteData(this.handler);
    props.faissIndexBucket.grantPut(this.handler);
    this.handler.addToRolePolicy(props.bedrockPolicyStatement);

    // Wraps the Lambda as a CloudFormation custom resource provider.
    // onEventHandler is invoked by CloudFormation on Create/Update/Delete events.
    const provider = new cr.Provider(this, 'SeedProvider', {
      onEventHandler: this.handler
    });

    // Declaring this resource in the stack is what triggers execution at deploy time.
    // CloudFormation creates/updates this resource on every `cdk deploy` where it has
    // changed, which causes the Provider to invoke the seed Lambda. serviceToken is
    // the ARN the Provider exposes to CloudFormation for that invocation.
    new cdk.CustomResource(this, 'SeedCustomResource', {
      serviceToken: provider.serviceToken
    });
  }
}
