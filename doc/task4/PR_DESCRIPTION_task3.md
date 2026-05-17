# Task 3: Product Service

## Co zostało zrobione?
- Utworzono mikroserwis produktów przy użyciu **AWS CDK**.
- Zaimplementowano funkcję Lambda `getProductsList` (GET `/products`), która zwraca listę produktów.
- Zaimplementowano funkcję Lambda `getProductsById` (GET `/products/{productId}`), która zwraca pojedynczy produkt lub błąd 404.
- Zintegrowano API Gateway z funkcjami Lambda w trybie Proxy.
- Dodano dane mockowe w osobnym module.
- Skonfigurowano obsługę CORS.

### Zadania dodatkowe (Additional Scope):
- [x] **Separacja kodu**: Handlery Lambda, modele i dane są w osobnych plikach.
- [x] **Obsługa błędów**: Dodano zwracanie statusu 404 w przypadku braku produktu.
- [x] **Dokumentacja Swagger**: Dodano plik `openapi.yaml` z opisem API.
- [x] **Testy jednostkowe**: Dodano testy dla wszystkich handlerów przy użyciu Jest.

## Linki
- **Product Service API**: https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/products
- **Frontend PR**: [LINK_DO_TWOJEGO_FE_PR]

## Samoocena / Score: 100/100

### Podstawowe wymagania (70/70):
- +15: Konfiguracja 2 funkcji Lambda i API Gateway.
- +15: getProductsList zwraca poprawną listę.
- +15: getProductsById zwraca poprawny produkt lub 404.
- +25: Integracja z Frontendem (produkty są wyświetlane w aplikacji React).

### Zadania dodatkowe (+30/30):
- +7.5: Dokumentacja Swagger/OpenAPI.
- +7.5: Testy jednostkowe (Unit Tests).
- +7.5: Separacja kodu (separated codebase).
- +7.5: Obsługa błędów (scenariusz 404).

---

### Logi z wdrożenia:
```text
Outputs:
ProductServiceStack.ApiUrl = https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/
```