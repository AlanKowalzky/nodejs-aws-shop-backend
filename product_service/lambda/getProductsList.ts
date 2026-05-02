import { APIGatewayProxyHandler } from 'aws-lambda';
import { products } from '../mock/products';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Event: ', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(products),
  };
};