import { handler } from '../lambda/getProductsList';
import { products } from '../mock/products';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const ddbMock = mockClient(DynamoDBClient);

describe('getProductsList handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env.PRODUCTS_TABLE = 'products';
    process.env.STOCKS_TABLE = 'stocks';
  });

  it('should return a successful response with the full list of products', async () => {
    ddbMock.on(ScanCommand).resolvesOnce({
      Items: [
        {
          id: { S: products[0].id },
          title: { S: products[0].title },
          description: { S: products[0].description },
          price: { N: String(products[0].price) },
        },
      ],
    }).resolvesOnce({
      Items: [
        {
          product_id: { S: products[0].id },
          count: { N: '7' },
        },
      ],
    });

    const event = {} as APIGatewayProxyEvent;

    const result = (await handler(event)) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.headers).toMatchObject({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    });

    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0]).toEqual({ ...products[0], count: 7 });
  });
});
