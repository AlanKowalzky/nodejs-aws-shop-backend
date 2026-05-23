# Transakcyjny Zapis Produktów (Etap 3)

Zgodnie z wymaganiem dodatkowym (+7.5), proces tworzenia produktu jest operacją atomową.

## Diagram sekwencji (Transaction Flow)

```mermaid
sequenceDiagram
    participant API as API Gateway (POST /products)
    participant Lambda as createProduct Lambda
    participant DDB as DynamoDB (Transaction)

    API->>Lambda: Request Body (title, price, count...)
    Lambda->>Lambda: Walidacja danych (400 if invalid)
    Lambda->>DDB: TransactWriteItems
    Note over DDB: Put products (id) AND Put stocks (product_id)
    DDB-->>Lambda: Success / Rollback
    Lambda-->>API: 201 Created / 500 Error
```

## Szczegóły implementacji
- **Walidacja (Status 400)**: Sprawdzamy czy wymagane pola (title, price, count) istnieją i mają poprawne typy.
- **Atomowość**: Używamy `TransactWriteItems`. Jeśli zapis do tabeli `stocks` zawiedzie, rekord w tabeli `products` nie zostanie utworzony.
- **Generowanie ID**: Lambda generuje unikalny `id` (UUID), który służy jako klucz w obu tabelach.
- **Logger**: Każdy przychodzący body jest logowany w CloudWatch.