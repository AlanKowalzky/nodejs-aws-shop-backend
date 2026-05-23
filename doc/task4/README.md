# Task 4: Integracja z NoSQL (DynamoDB)

Ten folder zawiera dokumentację techniczną dla zadania 4, podzieloną na etapy realizacji.

## Plan Realizacji

1. **Etap 1: Architektura i Seeding** (Zrealizowano)
   - Projekt modelu danych (ERD).
   - Skrypt zasilający tabele danymi testowymi.
2. **Etap 2: Infrastruktura i Odczyt (GET)**
   - Integracja CDK z istniejącymi tabelami.
   - Logika łączenia danych (Join) w Lambdach GET.
3. **Etap 3: Zapis i Transakcje (POST)**
   - Implementacja `createProduct`.
   - Zastosowanie `TransactWriteItems` dla spójności danych.
4. **Etap 4: Integracja FE i Raport PR**
   - Połączenie Frontendu z nowym API.
   - Przygotowanie raportu końcowego.

## Instrukcja Seeding-u

Aby zasilić bazę danych danymi testowymi, wykonaj poniższe komendy:

```bash
cd product_service
npm install uuid @aws-sdk/client-dynamodb
npm install -D @types/uuid
npx ts-node scripts/seed-dynamodb.ts
```

## Linki
- Architektura Systemu