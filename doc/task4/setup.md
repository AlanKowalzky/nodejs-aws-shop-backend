# Dokumentacja Etapu 1 - Integracja z NoSQL (DynamoDB)

Zgodnie z wymaganiem **Task 4.1**, tabele bazy danych zostały utworzone ręcznie za pomocą AWS Console w regionie docelowym.

## Schemat Bazy Danych (ERD)

Poniższy diagram przedstawia relację 1:1 między tabelami `products` i `stocks`.

```mermaid
erDiagram
    PRODUCTS ||--|| STOCKS : "has stock"
    PRODUCTS {
        string id PK "UUID"
        string title "not null"
        string description
        number price
    }
    STOCKS {
        string product_id PK "UUID (Foreign Key from products.id)"
        number count "integer"
    }
```

## Szczegóły Konfiguracji

1. **Tabela `products`**:
   - **Partition Key**: `id` (String)
   - **Tryb**: On-Demand (Pay per request)
2. **Tabela `stocks`**:
   - **Partition Key**: `product_id` (String)
   - **Tryb**: On-Demand (Pay per request)