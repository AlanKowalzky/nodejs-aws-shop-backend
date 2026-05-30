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

### Cognito practice

`ProductServiceStack` also creates a Cognito User Pool for the optional login-page practice task.

- `GET /products` is protected with a Cognito authorizer
- the Hosted UI login link is exposed from the stack output as `CognitoHostedUiUrl`
- the callback URL currently points to `https://d2gtnorsanlq4.cloudfront.net`

## Mermaid

### Import authorization flow

```mermaid
sequenceDiagram
    participant Client
    participant API as Import Service API Gateway
    participant Auth as Basic Authorizer Lambda
    participant S3 as S3 Bucket

    Client->>API: GET /import?name=file.csv\nAuthorization: Basic <token>
    API->>Auth: Invoke authorizer
    Auth->>Auth: Decode Base64 token
    Auth->>Auth: Compare login/password with env vars
    Auth-->>API: IAM policy Allow or Deny
    API->>S3: Generate signed upload URL
    API-->>Client: 200 signed URL
```

### Cognito practice flow

```mermaid
flowchart LR
    A[Client opens Hosted UI] --> B[Cognito User Pool]
    B --> C[Login or Sign Up]
    C --> D[Redirect back to client app]
    D --> E[Store token in browser]
    E --> F[GET /products]
    F --> G[Cognito authorizer]
    G --> H[GetProductsList Lambda]
    H --> I[Return products list]
```

## API

After deployment, use the stack outputs to get the base URLs:

- `ImportServiceStack.ApiUrl`
- `ProductServiceStack.ApiUrl`
- `ProductServiceStack.CognitoHostedUiUrl`

Endpoints:

- `GET /import?name=<file.csv>` - returns a signed S3 upload URL, requires `Authorization: Basic <token>`
- `GET /products` - returns the products list, protected with Cognito in the optional practice setup
- `GET /products/{productId}` - returns a single product
- `POST /products` - creates a new product

## Deploy

Run these commands from the repository root. If you are already inside a service folder, do not run `cd` into the same folder again.

```bash
cd authorization-service
cdk deploy AuthorizationServiceStack

cd ../import-service
cdk deploy ImportServiceStack

cd ../product_service
cdk deploy ProductServiceStack
```

Expected outputs:

- `AuthorizationServiceStack.BasicAuthorizerArn`
- `ImportServiceStack.ApiUrl`
- `ProductServiceStack.ApiUrl`
- `ProductServiceStack.CognitoHostedUiUrl`

Current deployed Import Service API:

- `https://eeaa54tcdc.execute-api.eu-central-1.amazonaws.com/prod/`
- `GET /import` full URL: `https://eeaa54tcdc.execute-api.eu-central-1.amazonaws.com/prod/import`

Current deployed Product Service API and Cognito practice outputs:

- `https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/`
- `ProductServiceStack.CognitoUserPoolId = eu-central-1_hZpxaFxGQ`
- `ProductServiceStack.CognitoAppClientId = 3u8n2bu8inh1anllc87gfk0ka0`
- `ProductServiceStack.CognitoHostedUiUrl = https://productserviceauthtask7.auth.eu-central-1.amazoncognito.com/login?client_id=3u8n2bu8inh1anllc87gfk0ka0&response_type=code&scope=openid+email+profile+phone&redirect_uri=https%3A%2F%2Fd2gtnorsanlq4.cloudfront.net`

Troubleshooting:

- if you are already inside `authorization-service`, `import-service`, or `product_service`, do not run `cd` into the same folder again before `cdk deploy`
- if `ProductServiceStack` fails on `AWS::Cognito::UserPoolDomain` with `Invalid request provided`, check that the Cognito domain prefix is lowercase, unique in the region, and shorter than 63 characters

## Reviewer Terminal Test

Use these commands from any shell after deployment.

### Import Service

Current URL:

```bash
https://eeaa54tcdc.execute-api.eu-central-1.amazonaws.com/prod/import
```

Missing auth should return `401`:

```bash
curl -i "https://eeaa54tcdc.execute-api.eu-central-1.amazonaws.com/prod/import?name=test.csv"
```

Invalid auth should return `403`:

```bash
curl -i -H "Authorization: Basic d3Jvbmc6d3Jvbmc=" "https://eeaa54tcdc.execute-api.eu-central-1.amazonaws.com/prod/import?name=test.csv"
```

Valid auth should return `200` and a signed URL:

```bash
curl -i -H "Authorization: Basic YWxhbmtvd2Fsemt5OlRFU1RfUEFTU1dPUkQ=" "https://eeaa54tcdc.execute-api.eu-central-1.amazonaws.com/prod/import?name=test.csv"
```

### Product Service Cognito Practice

Hosted UI:

```bash
https://productserviceauthtask7.auth.eu-central-1.amazoncognito.com/login?client_id=3u8n2bu8inh1anllc87gfk0ka0&response_type=code&scope=openid+email+profile+phone&redirect_uri=https%3A%2F%2Fd2gtnorsanlq4.cloudfront.net
```

After login, copy the `id_token` or `access_token` from the redirected URL and call:

```bash
curl -i -H "Authorization: Bearer <token>" "https://642wyzq699.execute-api.eu-central-1.amazonaws.com/prod/products"
```
