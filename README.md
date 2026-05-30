# Task 4: Integracja z NoSQL (DynamoDB)

Dokumentacja procesu integracji backendu z bazą danych DynamoDB. Zadanie podzielone na 4 etapy.

## Struktura Dokumentacji
1. [Architektura i Modele Danych](architecture.md) - Etap 1
2. [Budowa Skryptu Seedingowego](script-structure.md) - Etap 1
3. [Raport z Weryfikacji Etapu 1](stage1-summary.md) - Etap 1

## Komendy uruchomieniowe (Etap 1)

### Seeding bazy danych
Zasilenie tabel `products` i `stocks` danymi testowymi:
```bash
cd product_service
npm install uuid @aws-sdk/client-dynamodb
npx ts-node scripts/seed-dynamodb.ts
```

## Architektura (Mermaid)
Projekt zakłada użycie dwóch tabel DynamoDB (products, stocks) połączonych relacją 1:1 na poziomie logicznym aplikacji. Szczegóły w pliku architecture.md.
## Task 7 Authorization

`AuthorizationServiceStack` exposes the Basic Authorizer ARN through SSM at `/authorization-service/basic-authorizer-arn`.

### Request header

Use this header for the import endpoint:

```bash
Authorization: Basic <base64(login:TEST_PASSWORD)>
```

Example:

```bash
Authorization: Basic YWxhbmtvd2Fsemt5OlRFU1RfUEFTU1dPUkQ=
```

### Import endpoint behavior

- `GET /import?name=<file.csv>` returns a signed S3 upload URL
- missing `Authorization` header should return `401`
- invalid credentials should return `403`
