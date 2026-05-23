import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { mockClient } from 'aws-sdk-client-mock';
import { Context, SQSEvent } from 'aws-lambda';
import { handler } from '../lambda/catalogBatchProcess';

const ddbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

const mockContext = {} as Context;

const runHandler = (event: SQSEvent) =>
  handler(event, mockContext, () => {});

const validRecord = (overrides: Record<string, unknown> = {}) => ({
  body: JSON.stringify({
    title: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    count: 5,
    ...overrides,
  }),
});

describe('catalogBatchProcess', () => {
  beforeEach(() => {
    ddbMock.reset();
    snsMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    process.env.PRODUCTS_TABLE = 'products';
    process.env.STOCKS_TABLE = 'stocks';
    process.env.CREATE_PRODUCT_TOPIC_ARN = 'arn:aws:sns:eu-west-1:123456789012:createProductTopic';

    ddbMock.on(PutCommand).resolves({});
    snsMock.on(PublishCommand).resolves({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('zapisuje produkt i stock oraz publikuje SNS z atrybutem price', async () => {
    const event = { Records: [validRecord()] } as SQSEvent;

    await runHandler(event);

    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(2);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);

    const publishInput = snsMock.commandCalls(PublishCommand)[0].args[0].input;
    expect(publishInput.MessageAttributes?.price?.StringValue).toBe('99.99');
  });

  it('pomija niepoprawny rekord i przetwarza kolejny', async () => {
    const event = {
      Records: [
        validRecord({ title: '', price: -1 }),
        validRecord({ title: 'OK Product', price: 10, count: 1 }),
      ],
    } as SQSEvent;

    await runHandler(event);

    expect(ddbMock.commandCalls(PutCommand)).toHaveLength(2);
    expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);
  });

  it('rzuca błąd gdy brakuje PRODUCTS_TABLE', async () => {
    delete process.env.PRODUCTS_TABLE;

    const event = { Records: [validRecord()] } as SQSEvent;

    await expect(runHandler(event)).rejects.toThrow(
      'Missing table names in environment variables',
    );
  });
});
