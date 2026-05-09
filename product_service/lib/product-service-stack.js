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
const aws_lambda_nodejs_1 = require("aws-cdk-lib/aws-lambda-nodejs");
const path = __importStar(require("path"));
class ProductServiceStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const commonLambdaProps = {
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
        const getProductsList = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetProductsListHandler', {
            ...commonLambdaProps,
            entry: path.join(__dirname, '../lambda/getProductsList.ts'),
            handler: 'handler',
        });
        // Funkcja Lambda: Produkt po ID
        const getProductsById = new aws_lambda_nodejs_1.NodejsFunction(this, 'GetProductsByIdHandler', {
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
exports.ProductServiceStack = ProductServiceStack;
