"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductServiceStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const path = __importStar(require("path"));
class ProductServiceStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const commonLambdaProps = {
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
        const getProductsList = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetProductsListHandler', {
            ...commonLambdaProps,
            entry: path.join(__dirname, '../lambda/getProductsList.ts'),
            handler: 'handler',
        });
        const getProductsById = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetProductsByIdHandler', {
            ...commonLambdaProps,
            entry: path.join(__dirname, '../lambda/getProductsById.ts'),
            handler: 'handler',
        });
        // DODAJESZ TĘ DEFINICJĘ (Infrastruktura musi wiedzieć o pliku w /lambda/createProduct.ts)
        const createProduct = new aws_lambda_nodejs_1.NodejsFunction(this, 'CreateProductHandler', {
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
} /* DEBUG */
exports.ProductServiceStack = ProductServiceStack;
