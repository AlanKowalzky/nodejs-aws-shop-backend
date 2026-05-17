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

    const FRONTEND_URL = 'https://d2gtnorsanlq4.cloudfront.net';

    // 1. Referencje do tabel DynamoDB
    const productsTable = dynamodb.Table.fromTableName(this, 'ProductsTable', 'products');
    const stocksTable = dynamodb.Table.fromTableName(this, 'StocksTable', 'stocks');

    // 2. API Gateway
    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Product Service',
      defaultCorsPreflightOptions: {
        allowOrigins: [FRONTEND_URL],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });

    // 3. Wspólna konfiguracja dla wszystkich Lambd w folderze /lambda
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

    // --- DEFINICJE HANDLERÓW ---

    const getProductsList = new NodejsFunction(this, 'GetProductsListHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/getProductsList.ts'),
      handler: 'handler',
    });

    const getProductsById = new NodejsFunction(this, 'GetProductsByIdHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/getProductsById.ts'),
      handler: 'handler',
    });

    // DODAJESZ TĘ DEFINICJĘ (Infrastruktura musi wiedzieć o pliku w /lambda/createProduct.ts)
    const createProduct = new NodejsFunction(this, 'CreateProductHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/createProduct.ts'),
      handler: 'handler',
    });

    // --- UPRAWNIENIA ---
    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    stocksTable.grantReadData(getProductsById);

    // NADAJESZ UPRAWNIENIA DO ZAPISU (Dla transakcji w createProduct)
    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);

    // --- INTEGRACJA Z API GATEWAY ---
    const products = api.root.addResource('products');
    
    // Obsługa GET /products (to już miałeś)
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));
    
    // OBSŁUGA POST /products (tego brakowało w Stacku)
    products.addMethod('POST', new apigateway.LambdaIntegration(createProduct));

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
  }
}/* DEBUG */
