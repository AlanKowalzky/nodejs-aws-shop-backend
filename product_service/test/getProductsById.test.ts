import { handler } from '../lambda/getProductsById';
import { products } from '../mock/products';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

const ddbMock = mockClient(DynamoDBClient);

describe('getProductsById handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env.PRODUCTS_TABLE = 'products';
    process.env.STOCKS_TABLE = 'stocks';
  });

  it('should return 200 and the correct product if it exists', async () => {
    const targetProduct = products[0];
    ddbMock.on(GetItemCommand).resolvesOnce({
      Item: {
        id: { S: targetProduct.id },
        title: { S: targetProduct.title },
        description: { S: targetProduct.description },
        price: { N: String(targetProduct.price) },
      },
    }).resolvesOnce({
      Item: {
        product_id: { S: targetProduct.id },
        count: { N: '7' },
      },
    });

    const event = {
      pathParameters: {
        productId: targetProduct.id,
      },
    } as unknown as APIGatewayProxyEvent;

    const result = (await handler(event)) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual({ ...targetProduct, count: 7 });
    
    expect(body.id).toBe(targetProduct.id);
  });

  it('should return 404 and "Product not found" message if the product does not exist', async () => {
    ddbMock.on(GetItemCommand).resolves({
      Item: undefined,
    });

    const event = {
      pathParameters: {
        productId: 'non-existent-id',
      },
    } as unknown as APIGatewayProxyEvent;

    const result = (await handler(event)) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: 'Product not found',
    });
  });
});
