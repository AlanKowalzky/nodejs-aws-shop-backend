import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "node:crypto";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Logowanie przychodzącego żądania (Bonus +7.5 pkt)
  console.log('Incoming request:', JSON.stringify(event, null, 2));

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { title, description, price, count } = body || {};

    // Walidacja danych wejściowych (Bonus +7.5 pkt)
    if (!title || typeof price !== 'number' || typeof count !== 'number' || price < 0 || count < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          message: "Invalid product data. Title (string), price (number >= 0) and count (number >= 0) are required." 
        }),
      };
    }

    const id = randomUUID();
    const productsTable = process.env.PRODUCTS_TABLE;
    const stocksTable = process.env.STOCKS_TABLE;

    if (!productsTable || !stocksTable) {
      throw new Error("Missing table names in environment variables");
    }

    // Zapis transakcyjny (Bonus +7.5 pkt)
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
      headers,
      body: JSON.stringify({ id, title, description, price, count }),
    };

  } catch (error: any) {
    console.error('Error during product creation:', error);
    return {
      statusCode: 500, // Obsługa błędów 500 (Bonus +7.5 pkt)
      headers,
      body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
    };
  }
};
