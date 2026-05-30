import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const envVars = dotenv.config().parsed || {};

    const basicAuthorizer = new NodejsFunction(this, 'BasicAuthorizerHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda/basicAuthorizer/handler.ts'),
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: true,
        esbuildArgs: {
          '--packages': 'bundle',
        },
      },
      environment: {
        ...envVars,
      },
    });

    // Store the Lambda ARN in SSM Parameter Store for cross-stack reference
    new ssm.StringParameter(this, 'BasicAuthorizerArnParameter', {
      parameterName: '/authorization-service/basic-authorizer-arn',
      stringValue: basicAuthorizer.functionArn,
    });

    // Output for convenience
    new cdk.CfnOutput(this, 'BasicAuthorizerArn', {
      value: basicAuthorizer.functionArn,
      description: 'The ARN of the Basic Authorizer Lambda function',
    });
  }
}
