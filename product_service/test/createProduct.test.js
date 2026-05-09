"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createProduct_1 = require("../lambda/createProduct");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const aws_sdk_client_mock_1 = require("aws-sdk-client-mock");
const ddbMock = (0, aws_sdk_client_mock_1.mockClient)(lib_dynamodb_1.DynamoDBDocumentClient);
describe('createProduct handler', () => {
    beforeEach(() => {
        ddbMock.reset();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        process.env.PRODUCTS_TABLE = 'products';
        process.env.STOCKS_TABLE = 'stocks';
    });
    it('should return 201 and created product data on success', async () => {
        ddbMock.on(lib_dynamodb_1.TransactWriteCommand).resolves({});
        const event = {
            body: JSON.stringify({ title: 'Synthesizer', price: 500, count: 5 })
        };
        const result = await (0, createProduct_1.handler)(event);
        expect(result.statusCode).toBe(201);
        const body = JSON.parse(result.body);
        expect(body.title).toBe('Synthesizer');
        expect(body.id).toBeDefined();
        expect(ddbMock.calls()).toHaveLength(1);
    });
    it('should return 400 when title is missing', async () => {
        const event = {
            body: JSON.stringify({ price: 100, count: 5 })
        };
        const result = await (0, createProduct_1.handler)(event);
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toContain('Invalid product data');
    });
    it('should return 500 when database transaction fails', async () => {
        ddbMock.on(lib_dynamodb_1.TransactWriteCommand).rejects(new Error('DynamoDB connection error'));
        const event = {
            body: JSON.stringify({ title: 'Error Product', price: 10, count: 1 })
        };
        const result = await (0, createProduct_1.handler)(event);
        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).message).toBe('Internal Server Error');
    });
});
