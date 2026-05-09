"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getProductsById_1 = require("../lambda/getProductsById");
const products_1 = require("../mock/products");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const aws_sdk_client_mock_1 = require("aws-sdk-client-mock");
const ddbMock = (0, aws_sdk_client_mock_1.mockClient)(client_dynamodb_1.DynamoDBClient);
describe('getProductsById handler', () => {
    beforeEach(() => {
        ddbMock.reset();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        process.env.PRODUCTS_TABLE = 'products';
        process.env.STOCKS_TABLE = 'stocks';
    });
    it('should return 200 and the correct product if it exists', async () => {
        const targetProduct = products_1.products[0];
        ddbMock.on(client_dynamodb_1.GetItemCommand).resolvesOnce({
            Item: {
                id: { S: targetProduct.id },
                title: { S: targetProduct.title },
                description: { S: targetProduct.description },
                price: { N: String(targetProduct.price) },
            },
        }).resolvesOnce({
            Item: {
                product_id: { S: targetProduct.id },
                count: { N: '7' },
            },
        });
        const event = {
            pathParameters: {
                productId: targetProduct.id,
            },
        };
        const result = (await (0, getProductsById_1.handler)(event));
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body).toEqual({ ...targetProduct, count: 7 });
        expect(body.id).toBe(targetProduct.id);
    });
    it('should return 404 and "Product not found" message if the product does not exist', async () => {
        ddbMock.on(client_dynamodb_1.GetItemCommand).resolves({
            Item: undefined,
        });
        const event = {
            pathParameters: {
                productId: 'non-existent-id',
            },
        };
        const result = (await (0, getProductsById_1.handler)(event));
        expect(result.statusCode).toBe(404);
        const body = JSON.parse(result.body);
        expect(body).toEqual({
            message: 'Product not found',
        });
    });
});
