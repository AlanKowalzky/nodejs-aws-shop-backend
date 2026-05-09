# Wykorzystanie dokumentacji OpenAPI/Swagger

Poniższy diagram przedstawia przepływ pracy z dokumentacją API w projekcie.

```mermaid
graph TD
    Dev[Deweloper Backend] -->|Pisze specyfikację| YAML(openapi.yaml)
    YAML -->|Commit & Push| Git[Repozytorium Git]
    
    subgraph "Narzędzia Dokumentacji"
        YAML -->|Import| Editor[Swagger Editor]
        YAML -->|Renderowanie| UI[Swagger UI]
    end
    
    subgraph "Użycie"
        UI -->|Interaktywne testy| AGW[AWS API Gateway]
        FE_Dev[Deweloper Frontend] -->|Sprawdza kontrakty| UI
        FE_Dev -->|Implementuje requesty| React[Aplikacja React]
    end
    
    AGW -->|Zwraca dane| UI
    React -->|Wywołuje API| AGW
```

Dokumentacja pozwala na pracę w modelu **API-First**, gdzie struktura danych jest znana przed implementacją frontendu.