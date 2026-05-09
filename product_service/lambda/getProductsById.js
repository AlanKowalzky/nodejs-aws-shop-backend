"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const ddbClient = new client_dynamodb_1.DynamoDBClient({});
const handler = async (event) => {
    // Bonus: logowanie requestu i argumentów
    console.log('Incoming request [getProductsById]:', JSON.stringify(event));
    const { productId } = event.pathParameters || {};
    try {
        const productParams = {
            TableName: process.env.PRODUCTS_TABLE,
            Key: { id: { S: productId } }
        };
        const productData = await ddbClient.send(new client_dynamodb_1.GetItemCommand(productParams));
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
        const stockData = await ddbClient.send(new client_dynamodb_1.GetItemCommand(stockParams));
        const product = (0, util_dynamodb_1.unmarshall)(productData.Item);
        const stock = stockData.Item ? (0, util_dynamodb_1.unmarshall)(stockData.Item) : { count: 0 };
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
    }
    catch (error) {
        // Bonus: Obsługa błędu 500
        console.error('Database Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: String(error) })
        };
    }
};
exports.handler = handler;
