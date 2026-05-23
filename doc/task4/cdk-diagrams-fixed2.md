# Poprawione Diagramy CDK - Etap 3

Poniżej znajdują się poprawione wersje diagramów Mermaid dla Etapu 3, w których wyeliminowano błędy parsowania.

## 1. Diagram Uprawnień IAM (Poprawiony)

Zastąpiono składnię `Note over` (zarezerwowaną dla diagramów sekwencji) węzłem połączonym linią przerywaną, co jest poprawne dla typu `graph LR`.

```mermaid
graph LR
    subgraph "Tożsamość (IAM Role)"
        Role[CreateProductLambdaRole]
    end

    subgraph "Akcje (Allow)"
        Write["dynamodb:PutItem<br/>dynamodb:UpdateItem<br/>(via grantWriteData)"]
        Transact["dynamodb:TransactWriteItems"]
    end

    subgraph "Zasoby (Resources)"
        T1[(Table: products)]
        T2[(Table: stocks)]
    end

    Role --> Write
    Write --> T1
    Write --> T2
    Write -.- Note[CDK grantWriteData nadaje uprawnienia do obu tabel]
    style Note fill:#fff,stroke-dasharray: 5 5
```

## 2. Diagram Drzewa API Gateway (Poprawiony)

Naprawiono błąd `Lexical error` poprzez użycie cudzysłowów dla węzłów zawierających znaki specjalne (jak `/` czy `{}`) zamiast błędnej składni kształtów.

```mermaid
graph TD
    Root["/"] --> Products["products (Resource)"]
    
    subgraph "Istniejące Metody"
        Products --> GET_List["GET: getProductsList"]
    end
    
    subgraph "ZMIANA: Nowa Metoda"
        Products --> POST["POST: createProduct"]
        style POST fill:#f96,stroke:#333,stroke-width:2px
    end
    
    subgraph "Szczegóły Produktu"
        Products --> ID["{productId}"]
        ID --> GET_ID["GET: getProductsById"]
    end
```