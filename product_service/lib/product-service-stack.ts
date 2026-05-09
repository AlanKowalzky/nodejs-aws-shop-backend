import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Adres URL Twojego frontendu - to zasila nagłówki CORS
    const FRONTEND_URL = 'https://d2gtnorsanlq4.cloudfront.net';

    // Tworzymy API Gateway z globalną konfiguracją CORS
    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Product Service',
      description: 'Ten serwis obsługuje zapytania o produkty.',
      defaultCorsPreflightOptions: {
        allowOrigins: [FRONTEND_URL],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
    });

    // Wspólne właściwości dla wszystkich funkcji Lambda
    const commonLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        ALLOWED_ORIGIN: FRONTEND_URL,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
    };

    // Funkcja Lambda: Lista produktów
    const getProductsList = new NodejsFunction(this, 'GetProductsListHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/getProductsList.ts'),
      handler: 'handler',
    });

    // Funkcja Lambda: Produkt po ID
    const getProductsById = new NodejsFunction(this, 'GetProductsByIdHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/getProductsById.ts'),
      handler: 'handler',
    });

    // Definicja zasobów API
    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

    // Export adresu API po deployu
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
  }
}