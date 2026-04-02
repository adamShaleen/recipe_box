import * as cdk from 'aws-cdk-lib';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';

interface SeedConstructProps {
  table: dynamodb.Table;
  faissIndexBucket: s3.Bucket;
  bedrockPolicyStatement: iam.PolicyStatement;
}

export class SeedConstruct extends Construct {
  readonly handler: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: SeedConstructProps) {
    super(scope, id);

    this.handler = new lambdaNodejs.NodejsFunction(this, 'SeedHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      bundling: {
        externalModules: [],
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_inputDir, outputDir) => [
            `cp ${path.resolve(__dirname, '../../../../data/recipes.json')} ${outputDir}/recipes.json`
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

    const provider = new cr.Provider(this, 'SeedProvider', {
      onEventHandler: this.handler
    });

    new cdk.CustomResource(this, 'SeedCustomResource', {
      serviceToken: provider.serviceToken
    });
  }
}
