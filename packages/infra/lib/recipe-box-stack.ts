import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiConstruct } from './constructs/api';
import { BedrockConstruct } from './constructs/bedrock';
import { DatabaseConstruct } from './constructs/database';
import { SeedConstruct } from './constructs/seed';
import { StorageConstruct } from './constructs/storage';

export class RecipeBoxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const database = new DatabaseConstruct(this, 'Database');
    const storage = new StorageConstruct(this, 'Storage');
    const bedrock = new BedrockConstruct(this, 'Bedrock');

    new SeedConstruct(this, 'SeedLambda', {
      table: database.table,
      faissIndexBucket: storage.bucket,
      bedrockPolicyStatement: bedrock.policyStatement
    });

    new ApiConstruct(this, 'Api', {
      table: database.table,
      faissIndexBucket: storage.bucket,
      bedrockPolicyStatement: bedrock.policyStatement
    });
  }
}
