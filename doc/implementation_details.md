# Szczegóły Implementacji Backend (Task 3)

Poniższy schemat przedstawia strukturę zasobów zdefiniowanych w `ProductServiceStack`.

```mermaid
classDiagram
    class ProductServiceStack {
        +RestApi: Product Service
        +NodejsFunction: getProductsList
        +NodejsFunction: getProductsById
    }
    
    class API_Gateway {
        +Endpoint: /products
        +Endpoint: /products/\{productId\}
        +CORS: Allow All Origins
    }
    
    class Lambda_Logic {
        +Runtime: Node.js 20.x
        +Source: TypeScript
        +Data: Mocked Products
    }

    ProductServiceStack --> API_Gateway : Definiuje
    ProductServiceStack --> Lambda_Logic : Tworzy i konfiguruje
    API_Gateway ..> Lambda_Logic : Wyzwala integrację Proxy
```