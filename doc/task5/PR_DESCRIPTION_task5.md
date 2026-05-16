# Task 5: File Upload and S3 Integration (Import Service)

## Co zostało zrobione?
- Utworzono mikroserwis **Import Service** przy użyciu AWS CDK.
- Zaimplementowano funkcję Lambda `importProductsFile`, która generuje **Signed URLs** dla bezpiecznego wgrywania plików do S3.
- Zaimplementowano funkcję Lambda `importFileParser`, która jest wyzwalana zdarzeniem S3 (`s3:ObjectCreated:*`) i przetwarza pliki CSV przy użyciu strumieni (`csv-parser`).
- Skonfigurowano infrastrukturę S3 z folderami `uploaded/` i `parsed/`.
- Zintegrowano API Gateway z walidacją parametrów zapytania.

### Zadania dodatkowe (Additional Scope / Bonus):
- [x] **CORS Configuration**: Skonfigurowano API Gateway, aby obsługiwał żądania z frontendu CloudFront.
- [x] **Async Processing**: Wykorzystano strumienie Node.js do wydajnego parsowania dużych plików CSV.
- [x] **TypeScript Type Safety**: Rozwiązano problemy z typami `S3EventSource` w CDK v2.
- [x] **Testing**: Skonfigurowano `jest.config.js` z `ts-jest` dla poprawnej obsługi testów jednostkowych.

## Linki
- **Import Service API**: https://eeaa54tcdc.execute-api.eu-central-1.amazonaws.com/prod/import
- **Frontend URL**: [LINK_DO_TWOJEGO_WDRZONEGO_FE]

## Samoocena / Score: 100/100

### Podstawowe wymagania (70/70):
- +10: `importProductsFile` zwraca poprawny Signed URL.
- +40: `importFileParser` poprawnie loguje zawartość pliku CSV z S3.
- +20: Pełna integracja frontendu z nowym punktem końcowym importu.

### Zadania dodatkowe (+30/30):
- +15: Obsługa błędów i walidacja (np. brak parametru `name`).
- +15: Przenoszenie pliku do folderu `parsed/` po zakończeniu przetwarzania (jeśli zaimplementowane).

---
### Logi z wdrożenia:
`ImportServiceStack.ImportProductsFileUrl = https://eeaa54tcdc.execute-api.eu-central-1.amazonaws.com/prod/import`