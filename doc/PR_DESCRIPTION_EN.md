# Task 3: Product Service Implementation

## What was done?
- Created a Product Microservice using **AWS CDK**.
- Implemented `getProductsList` Lambda function (GET `/products`) to return the full product list.
- Implemented `getProductsById` Lambda function (GET `/products/{productId}`) to return a specific product or a 404 error.
- Integrated **API Gateway** with Lambda functions using Proxy Integration.
- Stored mock product data in a separate module with TypeScript interfaces.
- Configured **CORS** headers for frontend integration.

### Additional Scope:
- [x] **Code Separation**: Lambda handlers, data mocks, and infrastructure are separated into independent modules.
- [x] **Error Handling**: Implemented 404 "Product not found" scenario.
- [x] **Swagger/OpenAPI**: Added `openapi.yaml` specification for the API.
- [x] **Unit Testing**: Added comprehensive tests for all handlers using **Jest**.

## Links
- **Product Service API**: https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/products
- **Frontend PR**: [LINK_TO_YOUR_FRONTEND_PR]

## Self-Assessment / Score: 100/100

### Core Requirements (70/70):
- +15: Configuration of 2 Lambda functions and API Gateway.
- +15: `getProductsList` returns the correct product array.
- +15: `getProductsById` returns the correct product or 404.
- +25: Frontend integration (products are correctly displayed in the React app).

### Additional Tasks (+30/30):
- +7.5: Swagger/OpenAPI documentation.
- +7.5: Unit Tests for Lambda handlers.
- +7.5: Proper codebase separation.
- +7.5: Error handling logic (404 scenario).

---

### Deployment Logs:
```text
Outputs:
ProductServiceStack.ApiUrl = https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/
```