#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RecipeBoxStack } from '../lib/recipe-box-stack';

const app = new cdk.App();

new RecipeBoxStack(app, 'RecipeBoxStack', {
  env: {
    account: process.env['CDK_DEFAULT_ACCOUNT'],
    region: process.env['CDK_DEFAULT_REGION']
  }
});
