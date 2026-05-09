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

    // [TASK 3 + 4.2] Wspólne właściwości
    const commonLambdaProps: Partial<NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        ALLOWED_ORIGIN: FRONTEND_URL,
        PRODUCTS_TABLE: productsTable.tableName,
        STOCKS_TABLE: stocksTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/client-dynamodb', '@aws-sdk/util-dynamodb'],
      },
    };

    // 1. Lambda: Lista produktów (GET /products)
    const getProductsList = new NodejsFunction(this, 'GetProductsListHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/getProductsList.ts'),
      handler: 'handler',
    });

    // 2. Lambda: Produkt po ID (GET /products/{id})
    const getProductsById = new NodejsFunction(this, 'GetProductsByIdHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/getProductsById.ts'),
      handler: 'handler',
    });

    // 3. [TASK 4.3] Lambda: Tworzenie produktu (POST /products)
    const createProduct = new NodejsFunction(this, 'CreateProductHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/createProduct.ts'),
      handler: 'handler',
    });

    // UPRAWNIENIA
    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    stocksTable.grantReadData(getProductsById);

    // [TASK 4.3] Nadanie uprawnień do ZAPISU dla nowej Lambdy
    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);

    // DEFINICJA ZASOBÓW API
    const products = api.root.addResource('products');
    
    // GET /products
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));
    
    // [TASK 4.3] POST /products
    products.addMethod('POST', new apigateway.LambdaIntegration(createProduct));

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
  }
}