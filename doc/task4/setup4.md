# Konfiguracja Bazy Danych DynamoDB

Zgodnie z wymaganiem Task 4.1, tabele zostały utworzone w AWS Console.

## Model Danych (ERD)

```mermaid
erDiagram
    PRODUCTS ||--|| STOCKS : "1:1"
    PRODUCTS {
        string id PK "uuid"
        string title "not null"
        string description "text"
        number price "integer"
    }
    STOCKS {
        string product_id PK "uuid (FK)"
        number count "integer"
    }
```

## Szczegóły Tabel

- **products**:
    - Partition Key: `id` (S)
    - Billing Mode: PAY_PER_REQUEST
- **stocks**:
    - Partition Key: `product_id` (S)
    - Billing Mode: PAY_PER_REQUEST