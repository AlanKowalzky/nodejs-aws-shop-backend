"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const products_1 = require("../mock/products");
const handler = async (event) => {
    console.log('Event: ', JSON.stringify(event, null, 2));
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(products_1.products),
    };
};
exports.handler = handler;
