import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Definicja funkcji Lambda dla pobierania listy produktów
    const getProductsList = new nodejs.NodejsFunction(this, 'GetProductsListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/getProductsList.ts'),
      handler: 'handler',
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // Definicja funkcji Lambda dla pobierania pojedynczego produktu po ID
    const getProductsById = new nodejs.NodejsFunction(this, 'GetProductsByIdFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../lambda/getProductsById.ts'),
      handler: 'handler',
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // Tworzenie API Gateway o nazwie "Product Service"
    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Product Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      },
    });

    // Endpoint /products
    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));

    // Endpoint /products/{productId}
    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

    // Wyświetlenie adresu URL API po wdrożeniu
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'The URL of the Product Service API',
    });
  }
}