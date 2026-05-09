import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const ddbClient = new DynamoDBClient({});

export const handler = async (event: any) => {
  // Bonus: logowanie requestu i argumentów
  console.log('Incoming request [getProductsById]:', JSON.stringify(event));

  const { productId } = event.pathParameters || {};

  try {
    const productParams = {
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: { S: productId } }
    };

    const productData = await ddbClient.send(new GetItemCommand(productParams));

    if (!productData.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' })
      };
    }

    const stockParams = {
      TableName: process.env.STOCKS_TABLE,
      Key: { product_id: { S: productId } }
    };

    const stockData = await ddbClient.send(new GetItemCommand(stockParams));

    const product = unmarshall(productData.Item);
    const stock = stockData.Item ? unmarshall(stockData.Item) : { count: 0 };

    // Join danych w jeden model (Task 4.2)
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        ...product,
        count: stock.count
      })
    };
  } catch (error) {
    // Bonus: Obsługa błędu 500
    console.error('Database Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: String(error) })
    };
  }
};