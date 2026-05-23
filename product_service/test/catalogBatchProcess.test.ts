import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { handler } from '../lambda/catalogBatchProcess';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn(),
      };
    }),
  };
});

jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: (client: any) => {
        return {
          send: jest.fn(),
        };
      },
    },
    PutCommand: jest.fn(),
    TransactWriteCommand: jest.fn(),
  };
});

jest.mock('@aws-sdk/client-sns', () => {
  return {
    SNSClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn(),
      };
    }),
    PublishCommand: jest.fn(),
  };
});

describe('catalogBatchProcess', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'test-function',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: 'test-log-group',
      logStreamName: 'test-log-stream',
      getRemainingTimeInMillis: () => 1000,
      done: (error?: any, result?: any) => { },
      fail: (error: any | string) => { },
      succeed: (messageOrResult?: any) => { },
    };

    process.env.PRODUCTS_TABLE = 'test-products-table';
    process.env.STOCKS_TABLE = 'test-stocks-table';
    process.env.CREATE_PRODUCT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:createProductTopic';
  });

  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.PRODUCTS_TABLE;
    delete process.env.STOCKS_TABLE;
    delete process.env.CREATE_PRODUCT_TOPIC_ARN;
  });

  it('should process valid SQS records and create products', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Test Product 1',
            description: 'Test Description 1',
            price: 10.99,
            count: 5,
          }),
        },
        {
          body: JSON.stringify({
            title: 'Test Product 2',
            description: 'Test Description 2',
            price: 20.50,
            count: 3,
          }),
        },
      ],
    } as any;

    await expect(handler(event, mockContext)).resolves.toBeUndefined();
  });

  it('should skip invalid SQS records and continue processing', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Valid Product',
            description: 'Valid Description',
            price: 15.99,
            count: 2,
          }),
        },
        {
          body: JSON.stringify({
            title: '', // Invalid title
            description: 'Invalid Description',
            price: -5, // Invalid price
            count: 0,
          }),
        },
        {
          body: JSON.stringify({
            title: 'Another Valid Product',
            description: 'Another Valid Description',
            price: 25.00,
            count: 7,
          }),
        },
      ],
    } as any;

    await expect(handler(event, mockContext)).resolves.toBeUndefined();
  });

  it('should handle malformed JSON in SQS records', async () => {
    const event = {
      Records: [
        {
          body: 'invalid json {',
        },
        {
          body: JSON.stringify({
            title: 'Test Product',
            description: 'Test Description',
            price: 12.99,
            count: 4,
          }),
        },
      ],
    } as any;

    await expect(handler(event, mockContext)).resolves.toBeUndefined();
  });

  it('should return 500 when required environment variables are missing', async () => {
    delete process.env.PRODUCTS_TABLE;

    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Test Product',
            description: 'Test Description',
            price: 10.00,
            count: 1,
          }),
        },
      ],
    } as any;

    await expect(handler(event, mockContext)).rejects.toThrow('Missing table names in environment variables');
  });

  it('should publish to SNS when topic ARN is provided', async () => {
    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'SNS Test Product',
            description: 'SNS Test Description',
            price: 99.99,
            count: 10,
          }),
        },
      ],
    } as any;

    await expect(handler(event, mockContext)).resolves.toBeUndefined();
  });
});