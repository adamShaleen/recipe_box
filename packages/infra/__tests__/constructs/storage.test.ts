import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { StorageConstruct } from '../../lib/constructs/storage';

describe('StorageConstruct', () => {
  let template: Template;
  const s3Resource = 'AWS::S3::Bucket';

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    new StorageConstruct(stack, 'Bucket');
    template = Template.fromStack(stack);
  });

  it('creates exactly one S3 bucket', () => {
    template.resourceCountIs(s3Resource, 1);
  });

  it('creates the S3 bucket with the correct properties', () => {
    template.hasResourceProperties(s3Resource, {
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

  it('has a RETAIN removal policy', () => {
    template.hasResource(s3Resource, {
      DeletionPolicy: 'Retain'
    });
  });
});
