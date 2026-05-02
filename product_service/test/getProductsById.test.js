"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getProductsById_1 = require("../lambda/getProductsById");
const products_1 = require("../mock/products");
describe('getProductsById handler', () => {
    it('should return 200 and the correct product if it exists', async () => {
        const targetProduct = products_1.products[0];
        const event = {
            pathParameters: {
                productId: targetProduct.id,
            },
        };
        const result = (await (0, getProductsById_1.handler)(event, {}, () => { }));
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body).toEqual(targetProduct);
        expect(body.id).toBe(targetProduct.id);
    });
    it('should return 404 and "Product not found" message if the product does not exist', async () => {
        const event = {
            pathParameters: {
                productId: 'non-existent-id',
            },
        };
        const result = (await (0, getProductsById_1.handler)(event, {}, () => { }));
        expect(result.statusCode).toBe(404);
        const body = JSON.parse(result.body);
        expect(body).toEqual({
            message: 'Product not found',
        });
    });
});
