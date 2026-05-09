# Dokumentacja Etapu 2 - Odczyt Danych (GET)

Zgodnie z wymaganiem **Task 4.2**, dane z tabel `products` i `stocks` są łączone na poziomie backendu.

## Diagram przepływu danych (Mermaid)

```mermaid
graph TD
    A[Klient HTTP] -->|GET /products| B[Lambda: getProductsList]
    A -->|"GET /products/{id}"| C[Lambda: getProductsById]
    
    subgraph "Logic"
        B --> B1[Log Request]
        B1 --> B2[Scan products table]
        B1 --> B3[Scan stocks table]
        B2 & B3 --> B4[In-memory Join by id]
        
        C --> C1[Log Request + ID]
        C1 --> C2[GetItem product]
        C1 --> C3[GetItem stock]
        C2 & C3 --> C4[Merge objects]
    end

    B4 -->|200 OK| A
    C4 -->|200 OK / 404 Not Found| A
    Logic -.->|Error| E[500 Internal Server Error]
```

## Szczegóły implementacji
- **Join**: DynamoDB nie wspiera joinów, więc pobieramy dane z obu tabel i łączymy je w obiekcie odpowiedzi.
- **Logging**: Każdy request loguje cały `event` do CloudWatch.
- **Error Handling**: Cały kod jest w bloku try-catch, zwracając status 500 przy błędach bazy lub kodu.

## Troubleshooting: Fix Etapu 2 (ValidationException)

Podczas implementacji wystąpił błąd `500 Internal Server Error` z komunikatem `ValidationException: Value null at 'tableName'`.

### Przyczyna błędu (Diagram Sekwencji)
Błąd wynikał z faktu, że SDK DynamoDB otrzymało wartość `null` zamiast nazwy tabeli, ponieważ zmienne środowiskowe nie zostały poprawnie wstrzyknięte przez CDK.

```mermaid
sequenceDiagram
    participant U as Użytkownik (Curl/FE)
    participant API as API Gateway
    participant L as Lambda (getProductsList)
    participant DDB as DynamoDB Service

    U->>API: GET /products
    API->>L: Wywołanie funkcji
    Note over L: Próba odczytu process.env.PRODUCTS_TABLE
    Note right of L: Wynik: undefined (Brak w CDK environment)
    L->>DDB: Scan(TableName: null)
    DDB-->>L: 400 ValidationException: Value null at 'tableName'
    L-->>API: 500 Internal Server Error (Error Message)
    API-->>U: 500 Internal Server Error
```

### Rozwiązanie (Diagram Infrastruktury)
Poprawka polegała na jawnym przekazaniu nazw tabel z zasobów CDK do sekcji `environment` funkcji Lambda oraz nadaniu uprawnień IAM (`grantReadData`).

```mermaid
graph TD
    subgraph "AWS CDK Stack (Fix)"
        P_Table[(DynamoDB: products)]
        S_Table[(DynamoDB: stocks)]
        
        CDK_Logic[ProductServiceStack]
        
        CDK_Logic -->|1. Pobierz .tableName| P_Table
        CDK_Logic -->|1. Pobierz .tableName| S_Table
        
        subgraph "Lambda Configuration"
            L_Env[Environment Variables]
            L_Env -->|PRODUCTS_TABLE| L_Func[NodejsFunction]
            L_Env -->|STOCKS_TABLE| L_Func
        end
        
        CDK_Logic -->|2. Wstrzyknij nazwy| L_Env
        CDK_Logic -->|3. grantReadData| L_Func
    end
```