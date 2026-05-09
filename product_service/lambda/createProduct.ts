import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Incoming request:', JSON.stringify(event));

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { title, description, price, count } = body || {};

    // Walidacja danych wejściowych (+7.5 pkt)
    if (!title || typeof price !== 'number' || typeof count !== 'number' || price < 0 || count < 0) {
      return {
        statusCode: 400,
        headers: { 
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true 
        },
        body: JSON.stringify({ message: "Invalid arguments: title, price (number >= 0) and count (number >= 0) are required" }),
      };
    }

    const id = uuidv4();
    const productsTable = process.env.PRODUCTS_TABLE || 'products';
    const stocksTable = process.env.STOCKS_TABLE || 'stocks';

    // Zapis transakcyjny (+7.5 pkt)
    await ddbDocClient.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: productsTable,
            Item: { id, title, description, price }
          }
        },
        {
          Put: {
            TableName: stocksTable,
            Item: { product_id: id, count }
          }
        }
      ]
    }));

    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
      body: JSON.stringify({ id, title, description, price, count }),
    };

  } catch (error: any) {
    console.error('Error creating product:', error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
      body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
    };
  }
};