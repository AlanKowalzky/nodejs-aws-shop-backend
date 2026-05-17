# Dokumentacja Etapu 3 - Zapis i Transakcje (POST)

Zaimplementowano tworzenie produktów z wykorzystaniem transakcji ACID w DynamoDB.

## Funkcjonalności
1. **POST /products**: Punkt końcowy przyjmujący dane produktu i stanu magazynowego.
2. **Atomowość (Transactions)**: Wykorzystanie `TransactWriteItems`. Produkt i jego stan magazynowy są tworzone jednocześnie. Jeśli jeden zapis zawiedzie, cała operacja jest wycofywana.
3. **Walidacja**: System sprawdza obecność i typy pól `title`, `price` oraz `count`.

## Architektura i Przepływ Danych

### 1. Diagram Sekwencji (Interakcja Systemowa)
Opisuje komunikację od żądania klienta po odpowiedź końcową.

```mermaid
sequenceDiagram
    autonumber
    participant C as Klient (FE/Postman)
    participant AGW as API Gateway
    participant L as Lambda (createProduct)
    participant DDB as DynamoDB (TransactWrite)

    C->>AGW: POST /products (JSON Body)
    AGW->>L: Invoke Lambda Function
    L->>L: Log: Incoming request details
    
    Note over L: Walidacja danych (Schema Check)
    alt Dane są niepoprawne (Brak pól / Złe typy)
        L-->>AGW: 400 Bad Request
        AGW-->>C: Error: Invalid product data
    else Dane są poprawne
        L->>L: Generowanie UUID (v4)
        L->>DDB: TransactWriteItems (All-or-Nothing)
        alt Błąd bazy / Brak uprawnień
            DDB-->>L: Transaction Canceled / Error
            L-->>AGW: 500 Internal Server Error
            AGW-->>C: Error: Database Transaction Failed
        else Sukces zapisu
            DDB-->>L: 200 OK (Transaction Committed)
            L-->>AGW: 201 Created (+ New Product Object)
            AGW-->>C: Product Successfully Created
        end
    end
```

### 2. Diagram Logiki Wewnętrznej (Logic Flow)
Szczegółowy opis decyzji podejmowanych wewnątrz handlera.

```mermaid
flowchart TD
    Start([Request Received]) --> Log[Log Body to CloudWatch]
    Log --> Parse[Parse JSON Body]
    Parse --> Valid{Validation: <br/>title exists? <br/>price >= 0? <br/>count >= 0?}
    
    Valid -- NO --> Res400[/Return 400 Bad Request/]
    Valid -- YES --> UUID[Generate Product ID - UUID v4]
    
    UUID --> DB{DynamoDB <br/>TransactWriteItems}
    
    DB -- Error/Fail --> Res500[/Return 500 Internal Error/]
    DB -- Success --> Res201[/Return 201 Created/]
    
    Res400 & Res500 & Res201 --> End([End Request])
```

## Bonusy: Zrealizowano walidację (400), obsługę błędów (500), logowanie żądań oraz transakcyjność.