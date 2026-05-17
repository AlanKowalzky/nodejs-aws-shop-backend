# Podsumowanie Rozwiązania - Etap 2 (Task 4.2)

Implementacja odczytu danych z DynamoDB została zakończona sukcesem. Funkcje Lambda poprawnie łączą dane z tabel `products` oraz `stocks`.

## Status Integracji
- **Endpoint GET /products**: Działa (HTTP 200). Zwraca listę produktów z doklejonym polem `count`.
- **Endpoint GET /products/{id}**: Działa (HTTP 200/404). Zwraca szczegóły produktu wraz ze stanem magazynowym.
- **Baza Danych**: DynamoDB (Region: eu-central-1).

## Rozwiązane Problemy (Troubleshooting)

W trakcie prac zdiagnozowano i naprawiono dwa kluczowe błędy konfiguracyjne:

1. **Błąd: ValidationException (tableName null)**
   - **Przyczyna**: Brak zmiennych środowiskowych `PRODUCTS_TABLE` i `STOCKS_TABLE` w konfiguracji Lambdy.
   - **Rozwiązanie**: Dodanie mapowania nazw tabel do sekcji `environment` w stosie CDK.

2. **Błąd: AccessDeniedException**
   - **Przyczyna**: Brak uprawnień IAM dla roli Lambdy do wykonywania operacji `dynamodb:Scan` na zasobach.
   - **Rozwiązanie**: Wykorzystanie metody `grantReadData` w CDK, która automatycznie przypisała odpowiednie polityki bezpieczeństwa do ról funkcji.

## Weryfikacja CLI

Poprawność konfiguracji została potwierdzona za pomocą AWS CLI:
```bash
aws lambda get-function-configuration \
  --function-name <Function_Name> \
  --query 'Environment.Variables'
```
Wynik potwierdził obecność wszystkich wymaganych zmiennych sterujących połączeniem z bazą NoSQL.

## Architektura Końcowa (Mermaid)

```mermaid
graph LR
    API[API Gateway] --> L[Lambda: GetProducts]
    subgraph DynamoDB
        P[(Table: products)]
        S[(Table: stocks)]
    end
    L -->|Scan/GetItem| P
    L -->|Scan/GetItem| S
    Note over L: In-memory Join (id == product_id)
```

---
*Dokumentacja przygotowana na potrzeby Task 4 - RS School 2026.*