# Task 5 Progress Documentation

## Etap 1: Struktura projektu i konfiguracja (ukończono)

### Utworzono strukturę katalogów:
- import-service/
  - bin/ - punkt wejścia CDK
  - lib/ - stos CDK
  - lambda/ - funkcje Lambda
    - importProductsFile/ - funkcja generująca podpisane URL
    - importFileParser/ - funkcja przetwarzająca pliki CSV
  - test/ - katalog na testy
  - package.json - zależności
  - tsconfig.json - konfiguracja TypeScript
  - jest.config.js - konfiguracja testów
  - cdk.json - konfiguracja CDK

### Utworzono pliki konfiguracyjne:
1. **package.json** - zawiera zależności:
   - @aws-sdk/client-s3 (do operacji na S3)
   - aws-cdk-lib, constructs (infrastruktura jako kod)
   - csv-parser (do przetwarzania CSV)
   - source-map-support, uuid (wsparcie)
   - DevDependencies: @types/*, aws-cdk, aws-sdk-client-mock, esbuild, jest, ts-jest, typescript

2. **tsconfig.json** - konfiguracja TypeScript zgodna z product-service:
   - target: ES2022
   - module: commonjs
   - strict mode włączony
   - include: lambda, test, lib, bin

3. **jest.config.js** - konfiguracja testów:
   - preset: ts-jest
   - testEnvironment: node
   - testMatch: **/test/**/*.test.ts

4. **cdk.json** - konfiguracja aplikacji CDK:
   - app: npx ts-node bin/import-service.ts

### Utworzono stos CDK (ImportServiceStack):
- Tworzy kosz S3 z wersjonowaniem i szyfrowaniem
- Definiuje dwie funkcje Lambda:
  - importProductsFile: generuje podpisane URL do uploadu
  - importFileParser: przetwarza pliki CSV z kosza S3
- Przyznaje odpowiednie uprawnienia:
  - importProductsFile: s3:PutObject dla uploaded/*
  - importFileParser: s3:GetObject, s3:PutObject, s3:DeleteObject dla całego kosza
- Konfiguruje API Gateway z endpointem GET /import
- Dodaje trigger S3 dla funkcji importFileParser (zdarzenia OBJECT_CREATED w folderze uploaded/)
- Wyprowadza nazwę kosza, URL API i URL funkcji importProductsFile

### Diagramy architektury (Mermaid)

#### 1. Całkowita architektura usługi importowej
```mermaid
graph TD
    subgraph Frontend[Frontend Application]
        A[Interfejs użytkownika]
    end

    subgraph ImportService[Import Service]
        B[API Gateway]
        C[importProductsFile Lambda]
        D[importFileParser Lambda]
    end

    subgraph Storage[AWS S3]
        E[Bucket: imported-service-bucket]
        subfolder1[Folder: uploaded/]
        subfolder2[Folder: parsed/]
    end

    subgraph Monitoring[Monitoring i Logowanie]
        F[CloudWatch Logs]
    end

    A -->|Żądanie signed URL| B
    B -->|GET /import?name=file.csv| C
    C -->|Generuje signed URL PUT| E
    E -->|Zwraca signed URL| C
    C -->|Zwraca URL| B
    B -->|Zwraca URL| A
    A -->|Upload pliku przez signed URL| E
    E -->|Plik w uploaded/| subfolder1
    subfolder1 -->|Zdarzenie S3: ObjectCreated| D
    D -->|Odczytuje plik z uploaded/| E
    D -->|Parsuje CSV| F
    D -->|Kopiuje do parsed/| subfolder2
    D -->|Usuwa z uploaded/| subfolder1

    style B fill:#f9f,stroke:#333
    style C fill:#bbf,stroke:#333
    style D fill:#bfb,stroke:#333
    style E fill:#ffb,stroke:#333
    style F fill:#f99,stroke:#333
```

#### 2. Przepływ danych dla importProductsFile (generowanie signed URL)
```mermaid
sequenceDiagram
    participant Użytkownik
    participant API as API Gateway
    participant Lambda as importProductsFile Lambda
    participant S3 as S3 Bucket

    Użytkownik->>API: GET /import?name=products.csv
    API->>Lambda: Wywołaj funkcję
    Lambda->>S3: GetObjectCommand + getSignedUrl
    S3-->>Lambda: Podpisany URL (wygodny na 15 min)
    Lambda-->>API: Podpisany URL (tekst/plain)
    API-->>Użytkownik: Podpisany URL
    Użytkownik->>S3: PUT {podpisany URL} (plik CSV)
    S3-->>Użytkownik: Potwierdzenie uploadu
```

#### 3. Przepływ danych dla importFileParser (przetwarzanie CSV)
```mermaid
sequenceDiagram
    participant S3 as S3 Bucket
    participant Lambda as importFileParser Lambda
    participant Logs as CloudWatch Logs

    S3->>Lambda: Zdarzenie ObjectCreated (uploaded/products.csv)
    Lambda->>S3: GetObjectCommand (uploaded/products.csv)
    S3-->>Lambda: Strumień obiektu CSV
    Lambda->>Logs: Logowanie każdego rekordu CSV
    Lambda->>S3: CopyObjectCommand (do parsed/products.csv)
    Lambda->>S3: DeleteObjectCommand (z uploaded/products.csv)
    S3-->>Lambda: Potwierdzenie operacji
    Lambda-->>S3: HTTP 200 OK
```

#### 4. Diagram komponentów CDK
```mermaid
graph LR
    subgraph Stack[ImportServiceStack]
        direction TB
        Bucket[S3 Bucket]:::storage
        Api[API Gateway]:::gateway
        ImportProducts[importProductsFile Lambda]:::lambda
        ImportFile[importFileParser Lambda]:::lambda
    end

    Bucket -->|PutObject: uploaded/*| ImportProducts
    Bucket -->|ReadWrite| ImportFile
    ImportFile -->|S3 Event Source| Bucket
    Api -->|GET /import| ImportProducts

    classDef storage fill:#bfb,stroke:#333;
    classDef gateway fill:#f9f,stroke:#333;
    classDef lambda fill:#bbf,stroke:#333;
```
```

### Utworzono funkcje Lambda:

#### importProductsFile/handler.ts:
- Endpoint HTTP GET oczekujący parametru query `name` (nazwa pliku CSV)
- Waliduje obecność parametru `name`
- Używa @aws-sdk/client-s3 do generowania podpisanego URL PUT
- Klucz w formacie: `uploaded/${fileName}`
- URL podpisany ważny przez 15 minut (900 sekund)
- Zwraca czysty tekst (nie JSON) z nagłowkiem Content-Type: text/plain
- Obsługuje błędy zwracając odpowiednie kody statusu

#### importFileParser/handler.ts:
- Funkcja wyzwalana przez zdarzenia S3 ObjectCreated
- Przetwarza każdy rekord w zdarzeniu (S3 może grupować wiele rekordów)
- Dla każdego pliku:
  1. Pobiera obiekt z S3 jako strumień odczytywany
  2. Używa csv-parser do przetworzenia CSV z nagłówkami kolumn
  3. Loguje każdy rekord do CloudWatch
  4. (Opcjonalnie) przenosi plik do folderu parsed/ i usuwa z uploaded/
     - Kopiuje obiekt do parsed/[nazwa_pliku]
     - Usuwa oryginalny obiekt z uploaded/
- Obsługuje błędy z odpowiednim logowaniem

## Następne kroki:
1. Zainstalować zależności (npm install w katalogu import-service)
2. Zbudować projekt (npm run build)
3. Wdrożyć stos CDK (npm run cdk deploy)
4. Przetestować endpointy
5. Napisać testy jednostkowe

## Uwagi dotyczące bezpieczeństwa:
- Kosz S3 ma blokowany dostęp publiczny
- Wdrożono zasadę minimalnych uprawnień dla funkcji Lambda
- Usunięto komentarze zawierające dane uwierzytelniające
- W kodzie nie przechowuje się żadnych danych uwierzytelniających

## Gotowe do kontynuacji:
Po zapisaniu tej dokumentacji, możemy przejść do instalacji zależności i budowania projektu.