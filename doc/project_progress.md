# Postęp Projektu - Status Zadań

## Status Implementacji
```mermaid
stateDiagram-v2
    [*] --> Task2_Frontend: Zakończone
    Task2_Frontend --> Task3_Backend: W trakcie/Zakończone
    
    state Task2_Frontend {
        direction LR
        S3_Bucket --> CloudFront: Hosting SPA
        CloudFront --> Route53: (Opcjonalnie)
    }
    
    state Task3_Backend {
        direction LR
        Lambda_Functions --> API_Gateway: Integracja
        API_Gateway --> CORS_Config: Dostęp dla Frontendu
    }
```

## Architektura Połączona
```mermaid
graph LR
    User((Użytkownik)) -->|Przegląda sklep| CF[CloudFront SPA]
    CF -->|Pobiera statyczne pliki| S3[S3 Bucket]
    
    User -->|Wywołuje API| AGW[API Gateway: Product Service]
    AGW -->|GET /products| L1[Lambda: getProductsList]
    AGW -->|GET /products/\{id\}| L2[Lambda: getProductsById]
```