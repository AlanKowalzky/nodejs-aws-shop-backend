import { APIGatewayProxyHandler } from 'aws-lambda';
import { products, Product } from '../mock/products';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  const { productId } = event.pathParameters || {};
  const product = products.find((p: Product) => p.id === productId);

  if (!product) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ message: 'Product not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(product),
  };
};