"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const ddbClient = new client_dynamodb_1.DynamoDBClient({});
const handler = async (event) => {
    // Bonus: logowanie każdego przychodzącego żądania
    console.log('Incoming request [getProductsList]:', JSON.stringify(event));
    try {
        const productsParams = { TableName: process.env.PRODUCTS_TABLE };
        const stocksParams = { TableName: process.env.STOCKS_TABLE };
        // Pobieramy dane z obu tabel równolegle dla wydajności
        const [productsData, stocksData] = await Promise.all([
            ddbClient.send(new client_dynamodb_1.ScanCommand(productsParams)),
            ddbClient.send(new client_dynamodb_1.ScanCommand(stocksParams))
        ]);
        const products = productsData.Items?.map(item => (0, util_dynamodb_1.unmarshall)(item)) || [];
        const stocks = stocksData.Items?.map(item => (0, util_dynamodb_1.unmarshall)(item)) || [];
        // Join produktów i stanów magazynowych (Task 4.2)
        const joinedProducts = products.map(product => {
            const stock = stocks.find(s => s.product_id === product.id);
            return {
                ...product,
                count: stock ? stock.count : 0
            };
        });
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(joinedProducts)
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
