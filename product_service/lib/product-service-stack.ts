import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';
import * as path from 'path';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const FRONTEND_URL = 'https://d2gtnorsanlq4.cloudfront.net';
    const COGNITO_DOMAIN_PREFIX = 'productserviceauthtask7';

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

    const userPool = new cognito.UserPool(this, 'ProductServiceUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      autoVerify: {
        email: true,
      },
      userVerification: {
        emailSubject: 'Verify your email for Product Service',
        emailBody: 'Thanks for signing up. Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
    });

    const userPoolClient = userPool.addClient('ProductServiceAppClient', {
      generateSecret: false,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.PHONE,
        ],
        callbackUrls: [FRONTEND_URL],
        logoutUrls: [FRONTEND_URL],
      },
    });

    const userPoolDomain = userPool.addDomain('ProductServiceDomain', {
      cognitoDomain: {
        domainPrefix: COGNITO_DOMAIN_PREFIX,
      },
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ProductServiceCognitoAuthorizer', {
      cognitoUserPools: [userPool],
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
        externalModules: [
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/lib-dynamodb',
          '@aws-sdk/client-sns',
        ],
      },
    };

    // SQS queue for catalog items (consumed by catalogBatchProcess)
    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      queueName: 'catalogItemsQueue',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS topic for created products and an email subscription
    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
      topicName: 'createProductTopic',
    });

    createProductTopic.addSubscription(new subs.EmailSubscription('alankowalzky@gmail.com'));
    // Additional subscription for high-price products (price > 100)
    createProductTopic.addSubscription(new subs.EmailSubscription('alankowalzky+highprice@gmail.com', {
      filterPolicy: {
        price: sns.SubscriptionFilter.numericFilter({ greaterThan: 100 }),
      },
    }));

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

    const catalogBatchProcess = new NodejsFunction(this, 'CatalogBatchProcessHandler', {
      ...commonLambdaProps,
      entry: path.join(__dirname, '../lambda/catalogBatchProcess.ts'),
      handler: 'handler',
      environment: {
        ...commonLambdaProps.environment,
        CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
      },
    });

    catalogBatchProcess.addEventSource(new SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
    }));

    // --- UPRAWNIENIA ---
    productsTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);
    stocksTable.grantReadData(getProductsById);

    // NADAJESZ UPRAWNIENIA DO ZAPISU (Dla transakcji w createProduct)
    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);
    productsTable.grantWriteData(catalogBatchProcess);
    stocksTable.grantWriteData(catalogBatchProcess);
    createProductTopic.grantPublish(catalogBatchProcess);

    // --- INTEGRACJA Z API GATEWAY ---
    const products = api.root.addResource('products');
    
    // Obsługa GET /products (to już miałeś)
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    
    // OBSŁUGA POST /products (tego brakowało w Stacku)
    products.addMethod('POST', new apigateway.LambdaIntegration(createProduct));

    const product = products.addResource('{productId}');
    product.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'CognitoUserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'CognitoAppClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'CognitoHostedUiUrl', {
      value: `https://${userPoolDomain.domainName}.auth.${cdk.Aws.REGION}.amazoncognito.com/login?client_id=${userPoolClient.userPoolClientId}&response_type=code&scope=openid+email+profile+phone&redirect_uri=${encodeURIComponent(FRONTEND_URL)}`,
      description: 'Hosted UI login URL for Cognito',
    });
  }
}
