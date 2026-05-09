# Task 4: Integration with NoSQL Database

## Co zostało zrobione?
- Utworzono tabele w **DynamoDB** (`products` i `stocks`) zgodnie z wymaganym schematem.
- Przygotowano i uruchomiono skrypt zasilający (`seed-dynamodb.ts`), który wypełnił bazę danymi testowymi.
- Zmodyfikowano funkcje `getProductsList` i `getProductsById`, aby pobierały dane z DynamoDB i wykonywały logikę "Join" na poziomie backendu.
- Zaimplementowano nową funkcję Lambda `createProduct` (POST `/products`), obsługującą tworzenie produktów.
- Skonfigurowano uprawnienia IAM (grantReadData/grantWriteData) oraz zmienne środowiskowe w CDK.

### Zadania dodatkowe (Additional Scope / Bonus):
- [x] **Status 400**: Walidacja danych wejściowych w `createProduct` (zwraca 400 przy błędnych danych).
- [x] **Status 500**: Obsługa błędów we wszystkich Lambdach (try-catch) z logowaniem błędów.
- [x] **Logger**: Logowanie każdego przychodzącego żądania i jego argumentów do CloudWatch.
- [x] **Transactions**: Wykorzystanie `TransactWriteItems` w `createProduct` dla zapewnienia atomowości zapisu do tabel `products` i `stocks`.

## Linki
- **Product Service API**: https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/products
- **Frontend URL**: [LINK_DO_TWOJEGO_WDRZONEGO_FE]

## Samoocena / Score: 100/100

### Podstawowe wymagania (70/70):
- +20: Task 4.1 - Tabele DynamoDB utworzone i zasilone danymi.
- +20: Task 4.2 - Lambdy zintegrowane z bazą (logika Join).
- +20: Task 4.3 - Implementacja `createProduct` działająca z POST /products.
- +10: Task 4.4 - Integracja z Frontendem i opis PR.

### Zadania dodatkowe (+30/30):
- +7.5: Walidacja danych (400 error).
- +7.5: Obsługa błędów 500.
- +7.5: Logowanie żądań.
- +7.5: Zapis transakcyjny (Atomic creation).

---

### Logi z wdrożenia:
```text
Outputs:
ProductServiceStack.ApiUrl = https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/
```