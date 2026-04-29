import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';

interface ApiConstructProps {
  apiKey: string;
  table: dynamodb.Table;
  faissIndexBucket: s3.Bucket;
  bedrockPolicyStatement: iam.PolicyStatement;
  bedrockMarketplacePolicyStatement: iam.PolicyStatement;
  forceDockerBundling?: boolean;
}

export class ApiConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const sharedEnv: Record<string, string> = {
      TABLE_NAME: props.table.tableName,
      FAISS_BUCKET: props.faissIndexBucket.bucketName,
      API_KEY: props.apiKey
    };

    const lambdaDefaults: Partial<lambdaNodejs.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      bundling: { externalModules: [] }
    };

    const apiRoot = path.resolve(__dirname, '../../../api/src/handlers');

    const getRecipesHandler = new lambdaNodejs.NodejsFunction(this, 'GetRecipesHandler', {
      ...lambdaDefaults,
      description: 'GetRecipes',
      entry: path.join(apiRoot, 'get-recipes.ts'),
      handler: 'handler',
      environment: sharedEnv
    });

    const getRecipeHandler = new lambdaNodejs.NodejsFunction(this, 'GetRecipeHandler', {
      ...lambdaDefaults,
      description: 'GetRecipe',
      entry: path.join(apiRoot, 'get-recipe.ts'),
      handler: 'handler',
      environment: sharedEnv
    });

    const modifyRecipeHandler = new lambdaNodejs.NodejsFunction(this, 'ModifyRecipeHandler', {
      ...lambdaDefaults,
      description: 'ModifyRecipe',
      entry: path.join(apiRoot, 'modify-recipe.ts'),
      handler: 'handler',
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60),
      environment: sharedEnv,
      bundling: { nodeModules: ['faiss-node'], forceDockerBundling: props.forceDockerBundling ?? true }
    });

    props.table.grantReadData(getRecipesHandler);
    props.table.grantReadData(getRecipeHandler);
    props.table.grantReadData(modifyRecipeHandler);
    props.faissIndexBucket.grantRead(modifyRecipeHandler);
    modifyRecipeHandler.addToRolePolicy(props.bedrockPolicyStatement);
    modifyRecipeHandler.addToRolePolicy(props.bedrockMarketplacePolicyStatement);

    const api = new apigateway.RestApi(this, 'RecipeBoxApi', {
      restApiName: 'recipe-box-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'x-api-key']
      }
    });

    const recipes = api.root.addResource('recipes');
    const recipe = recipes.addResource('{id}');
    const modify = recipe.addResource('modify');

    recipes.addMethod('GET', new apigateway.LambdaIntegration(getRecipesHandler));
    recipe.addMethod('GET', new apigateway.LambdaIntegration(getRecipeHandler));
    modify.addMethod('POST', new apigateway.LambdaIntegration(modifyRecipeHandler));
  }
}
