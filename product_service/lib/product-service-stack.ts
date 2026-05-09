import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // [TASK 3] Adres URL Twojego frontendu
    const FRONTEND_URL = 'https://d2gtnorsanlq4.cloudfront.net';

    // [TASK 4.1] Pobranie referencji do tabel DynamoDB
    const productsTable = dynamodb.Table.fromTableName(this, 'ProductsTable', 'products');
    const stocksTable = dynamodb.Table.fromTableName(this, 'StocksTable', 'stocks');

    // [TASK 3] API Gateway z Twoją globalną konfiguracją CORS
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

    // [TASK 3 + 4.2] Wspólne właściwości (DOPISANO PRODUCTS_TABLE i STOCKS_TABLE)
    const commonLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        ALLOWED_ORIGIN: FRONTEND_URL,
        PRODUCTS_TABLE: productsTable.tableName, // TO NAPRAWIA BŁĄD 500
        STOCKS_TABLE: stocksTable.tableName,     // TO NAPRAWIA BŁĄD 500
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/util-dynamodb'],
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

    // [TASK 4.2] Nadanie uprawnień do odczytu (Grant Read Data)
    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    stocksTable.grantReadData(getProductsById);

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
