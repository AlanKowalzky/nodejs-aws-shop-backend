# Szczegóły Implementacji CDK

Struktura zasobów zdefiniowana w klasie `ProductServiceStack`.

```mermaid
classDiagram
    class ProductServiceStack {
        +RestApi: ProductService
        +NodejsFunction: getProductsList
        +NodejsFunction: getProductsById
    }

    class Endpoints {
        +GET /products
        +GET /products/\{productId\}
        +CORS: allow_all
    }

    ProductServiceStack --> Endpoints : Eksponuje
    Endpoints --> NodejsFunction : Triggeruje
```