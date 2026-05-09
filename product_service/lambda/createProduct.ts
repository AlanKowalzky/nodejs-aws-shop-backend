import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const ddbClient = new DynamoDBClient({});

export const handler = async (event: any) => {
  // Logger dla każdego przychodzącego zapytania (Bonus Task)
  console.log("Incoming POST /products request:", JSON.stringify(event));

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { title, description, price, count } = body;

    // Walidacja danych (Bonus Task: Status 400)
    if (!title || typeof price !== 'number' || typeof count !== 'number' || price < 0 || count < 0) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
        body: JSON.stringify({ message: "Invalid product data: title (string), price (number >= 0), and count (number >= 0) are required." }),
      };
    }

    const id = uuidv4();
    const productsTable = process.env.PRODUCTS_TABLE;
    const stocksTable = process.env.STOCKS_TABLE;

    // Transakcyjny zapis (Bonus Task: Transaction-based creation)
    const transactionCommand = new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: productsTable,
            Item: {
              id: { S: id },
              title: { S: title },
              description: { S: description || "" },
              price: { N: price.toString() },
            },
          },
        },
        {
          Put: {
            TableName: stocksTable,
            Item: {
              product_id: { S: id },
              count: { N: count.toString() },
            },
          },
        },
      ],
    });

    await ddbClient.send(transactionCommand);

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ id, title, description, price, count }),
    };
  } catch (error: any) {
    // Obsługa błędów (Bonus Task: Status 500)
    console.error("Error creating product:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
      body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
    };
  }
};