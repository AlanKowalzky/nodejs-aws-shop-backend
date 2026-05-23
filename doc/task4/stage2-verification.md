# Weryfikacja Etapu 2 - Odczyt danych (GET)

## Status
- **API URL**: `https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/`
- **Endpoints**: 
    - `GET /products`
    - `GET /products/{productId}`

## Wyniki testów

### 1. Test "Join" (Task 4.2)
Pobrano listę produktów. Każdy element zawiera połączone dane z tabel `products` i `stocks`.
Przykładowy rekord:
```json
{
  "id": "...",
  "title": "...",
  "price": 100,
  "count": 5
}
```

### 2. Test logowania (Bonus +7.5)
Zweryfikowano w CloudWatch Log Groups. Każde zapytanie generuje wpis `Incoming request` z pełnym obiektem eventu.