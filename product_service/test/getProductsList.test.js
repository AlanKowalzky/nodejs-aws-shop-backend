"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getProductsList_1 = require("../lambda/getProductsList");
const products_1 = require("../mock/products");
describe('getProductsList handler', () => {
    it('should return a successful response with the full list of products', async () => {
        const event = {};
        const result = (await (0, getProductsList_1.handler)(event, {}, () => { }));
        expect(result.statusCode).toBe(200);
        expect(result.headers).toMatchObject({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        });
        const body = JSON.parse(result.body);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBe(products_1.products.length);
        expect(body).toEqual(products_1.products);
    });
});
