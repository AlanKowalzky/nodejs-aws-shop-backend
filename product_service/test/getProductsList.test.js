"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getProductsList_1 = require("../lambda/getProductsList");
const products_1 = require("../mock/products");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const aws_sdk_client_mock_1 = require("aws-sdk-client-mock");
const ddbMock = (0, aws_sdk_client_mock_1.mockClient)(client_dynamodb_1.DynamoDBClient);
describe('getProductsList handler', () => {
    beforeEach(() => {
        ddbMock.reset();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        process.env.PRODUCTS_TABLE = 'products';
        process.env.STOCKS_TABLE = 'stocks';
    });
    it('should return a successful response with the full list of products', async () => {
        ddbMock.on(client_dynamodb_1.ScanCommand).resolvesOnce({
            Items: [
                {
                    id: { S: products_1.products[0].id },
                    title: { S: products_1.products[0].title },
                    description: { S: products_1.products[0].description },
                    price: { N: String(products_1.products[0].price) },
                },
            ],
        }).resolvesOnce({
            Items: [
                {
                    product_id: { S: products_1.products[0].id },
                    count: { N: '7' },
                },
            ],
        });
        const event = {};
        const result = (await (0, getProductsList_1.handler)(event));
        expect(result.statusCode).toBe(200);
        expect(result.headers).toMatchObject({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        });
        const body = JSON.parse(result.body);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(1);
        expect(body[0]).toEqual({ ...products_1.products[0], count: 7 });
    });
});
