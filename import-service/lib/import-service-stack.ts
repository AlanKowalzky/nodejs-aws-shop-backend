import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for file uploads
    const importBucket = new s3.Bucket(this, 'ImportBucket', {
      bucketName: `import-service-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT for production!
      autoDeleteObjects: true, // NOT for production!
    });

    const catalogItemsQueue = sqs.Queue.fromQueueArn(
      this,
      'CatalogItemsQueue',
      `arn:aws:sqs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:catalogItemsQueue`,
    );

    // Common Lambda configuration
    const commonLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/client-s3', '@aws-sdk/client-sqs'],
      },
    };

    // importProductsFile Lambda - generates signed URLs
    const importProductsFile = new NodejsFunction(this, 'ImportProductsFileHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/importProductsFile/handler.ts'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: importBucket.bucketName,
      },
    });

    // importFileParser Lambda - processes uploaded CSV files
    const importFileParser = new NodejsFunction(this, 'ImportFileParserHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/importFileParser/handler.ts'),
      handler: 'handler',
      environment: {
        BUCKET_NAME: importBucket.bucketName,
        CATALOG_ITEMS_QUEUE_URL: `https://sqs.${cdk.Aws.REGION}.amazonaws.com/${cdk.Aws.ACCOUNT_ID}/catalogItemsQueue`,
      },
    });

    // Grant permissions to importProductsFile Lambda
    importBucket.grantPut(importProductsFile, 'uploaded/*');

    // Grant permissions to importFileParser Lambda
    importBucket.grantReadWrite(importFileParser);
    catalogItemsQueue.grantSendMessages(importFileParser);

    // Add S3 event trigger for importFileParser
    importFileParser.addEventSource(new S3EventSource(importBucket, {
      events: [s3.EventType.OBJECT_CREATED],
      filters: [{ prefix: 'uploaded/' }]
    }));

    // API Gateway for importProductsFile endpoint
    const api = new apigateway.RestApi(this, 'ImportApi', {
      restApiName: 'Import Service',
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://d2gtnorsanlq4.cloudfront.net'], // Frontend URL from product-service
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });

    // GET /import endpoint
    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFile));

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: importBucket.bucketName,
      description: 'Name of the S3 bucket for file imports'
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL of the Import Service API'
    });

    new cdk.CfnOutput(this, 'ImportProductsFileUrl', {
      value: `${api.url}import`,
      description: 'URL for generating signed URLs'
    });
  }
}