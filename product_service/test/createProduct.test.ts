import { handler } from '../handlers/createProduct';
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('createProduct handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 201 and created product data on success', async () => {
    ddbMock.on(TransactWriteCommand).resolves({});

    const event = {
      body: JSON.stringify({ title: 'Synthesizer', price: 500, count: 5 })
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.title).toBe('Synthesizer');
    expect(body.id).toBeDefined();
    expect(ddbMock.calls()).toHaveLength(1);
  });

  it('should return 400 when title is missing', async () => {
    const event = {
      body: JSON.stringify({ price: 100, count: 5 })
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain('Invalid arguments');
  });

  it('should return 500 when database transaction fails', async () => {
    ddbMock.on(TransactWriteCommand).rejects(new Error('DynamoDB connection error'));

    const event = {
      body: JSON.stringify({ title: 'Error Product', price: 10, count: 1 })
    } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body).message).toBe('Internal Server Error');
  });
});