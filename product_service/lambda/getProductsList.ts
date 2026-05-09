import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Callback } from 'aws-lambda';
import { products } from '../mock/products';

export const handler = async (event: APIGatewayProxyEvent, _context?: Context, _callback?: Callback): Promise<APIGatewayProxyResult> => {
  const origin = process.env.ALLOWED_ORIGIN || "*";
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": origin !== "*",
  };

  try {
    console.log('Incoming request event (List):', JSON.stringify(event));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(products),
    };
  } catch (error) {
    console.error('Error in getProductsList:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};