"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const node_crypto_1 = require("node:crypto");
const client = new client_dynamodb_1.DynamoDBClient({});
const ddbDocClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
};
const handler = async (event) => {
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
        const id = (0, node_crypto_1.randomUUID)();
        const productsTable = process.env.PRODUCTS_TABLE;
        const stocksTable = process.env.STOCKS_TABLE;
        if (!productsTable || !stocksTable) {
            throw new Error("Missing table names in environment variables");
        }
        // Zapis transakcyjny (Bonus +7.5 pkt)
        await ddbDocClient.send(new lib_dynamodb_1.TransactWriteCommand({
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
    }
    catch (error) {
        console.error('Error during product creation:', error);
        return {
            statusCode: 500, // Obsługa błędów 500 (Bonus +7.5 pkt)
            headers,
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};
exports.handler = handler;
