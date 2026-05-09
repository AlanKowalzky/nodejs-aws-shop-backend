# Raport z Weryfikacji - Etap 1

## Status Realizacji
- [x] Manualne utworzenie tabel `products` i `stocks` w AWS Console (Zgodnie z Task 4.1).
- [x] Przygotowanie skryptu zasilającego `seed-dynamodb.ts`.
- [x] Weryfikacja obecności danych w DynamoDB.
- [x] Przygotowanie dokumentacji architektury z diagramami Mermaid.

## Metody weryfikacji danych

### 1. Sprawdzenie przez AWS CLI
Pobranie produktów:
```bash
aws dynamodb scan --table-name products
```

Pobranie stanów magazynowych:
```bash
aws dynamodb scan --table-name stocks
```

### 2. Sprawdzenie przez AWS Console
- Zakładka **Explore items** w usłudze DynamoDB dla obu tabel.
- Weryfikacja czy `id` z tabeli `products` odpowiada `product_id` w tabeli `stocks`.

## Diagram weryfikacji

```mermaid
graph LR
    CLI[AWS CLI Scan] -->|Zwraca dane| OK[Dane poprawne]
    Console[AWS Console] -->|Wizualizacja| OK
    Script[Seed Script] -->|Logi [OK]| OK
```

## Następne kroki
W Etapie 2 zostanie zaimplementowana logika odczytu danych przez Lambdy GET oraz integracja nazw tabel w AWS CDK.