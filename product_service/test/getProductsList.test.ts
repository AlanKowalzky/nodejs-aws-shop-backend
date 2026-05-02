import { handler } from '../lambda/getProductsList';
import { products } from '../mock/products';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

describe('getProductsList handler', () => {
  it('should return a successful response with the full list of products', async () => {
    const event = {} as APIGatewayProxyEvent;

    const result = (await handler(event, {} as any, () => {})) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.headers).toMatchObject({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    });

    const body = JSON.parse(result.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(products.length);
    expect(body).toEqual(products);
  });
});