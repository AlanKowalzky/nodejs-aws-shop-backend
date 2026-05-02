import { handler } from '../lambda/getProductsById';
import { products } from '../mock/products';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

describe('getProductsById handler', () => {
  it('should return 200 and the correct product if it exists', async () => {
    const targetProduct = products[0];
    const event = {
      pathParameters: {
        productId: targetProduct.id,
      },
    } as unknown as APIGatewayProxyEvent;

    const result = (await handler(event, {} as any, () => {})) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toEqual(targetProduct);
    
    expect(body.id).toBe(targetProduct.id);
  });

  it('should return 404 and "Product not found" message if the product does not exist', async () => {
    const event = {
      pathParameters: {
        productId: 'non-existent-id',
      },
    } as unknown as APIGatewayProxyEvent;

    const result = (await handler(event, {} as any, () => {})) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body).toEqual({
      message: 'Product not found',
    });
  });
});