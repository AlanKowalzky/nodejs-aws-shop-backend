"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const products_1 = require("../mock/products");
const handler = async (event) => {
    console.log('Event: ', JSON.stringify(event, null, 2));
    const { productId } = event.pathParameters || {};
    const product = products_1.products.find((p) => p.id === productId);
    if (!product) {
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: 'Product not found' }),
        };
    }
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(product),
    };
};
exports.handler = handler;
