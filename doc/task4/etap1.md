# Dokumentacja Etapu 1 - Integracja z DynamoDB

W ramach pierwszego etapu skonfigurowano bazę danych NoSQL oraz przygotowano skrypty zasilające.

## Model Danych (ERD)

Dane są przechowywane w dwóch oddzielnych tabelach DynamoDB, połączonych relacją 1:1 za pomocą `id` produktu.

```mermaid
erDiagram
    PRODUCTS ||--|| STOCKS : "relacja 1:1"
    PRODUCTS {
        string id PK "UUID produktu"
        string title "Tytuł produktu"
        string description "Opis produktu"
        number price "Cena (integer)"
    }
    STOCKS {
        string product_id PK "Foreign Key z products.id"
        number count "Liczba sztuk w magazynie"
    }
```

## Decyzje projektowe

1.  **Tabele**: Utworzono tabele `products` oraz `stocks`.
2.  **Klucze**:
    *   `products`: Partition Key = `id` (String).
    *   `stocks`: Partition Key = `product_id` (String).
3.  **Tryb wydajności**: `PAY_PER_REQUEST` (On-Demand), aby zminimalizować koszty przy małym ruchu.

## Proces zasilania (Seeding)

Do zasilenia bazy danych wykorzystano skrypt `product_service/scripts/seed-dynamodb.ts`, który:
1. Generuje unikalne ID dla produktów.
2. Wstawia dane atomowo do tabeli produktów.
3. Wstawia powiązany stan magazynowy do tabeli stocks.