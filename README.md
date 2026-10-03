[🇬🇧 English](README.md) | [🇪🇸 Español](README.es.md)

# Document-Flow-Automation

Document-Flow-Automation is a backend solution for automating the receipt, validation, and storage of invoices received by email. The workflow is designed to process PDF documents, extract the relevant information, and save it in a database so that the data remains available for queries and tracking.

The system is designed as a modular monolith orchestrated by n8n, with a separate business layer to facilitate testing, maintenance, and technical demonstration.

## Project goal

Solve the problem of manual invoice management sent by email in small and medium-sized companies:

- opening emails and downloading attachments manually,
- reading and capturing invoice data,
- transcribing information into spreadsheets or accounting systems,
- repeating work or making typing errors,
- losing traceability of the original document.

The proposed solution automates this flow with a REST API, deterministic extraction of data from a controlled PDF, and structured persistence of the results.

## Scope of the current version

### Included

- IMAP email listening via n8n,
- processing of a single controlled invoice PDF format,
- text extraction with `pdf-parse`,
- schema validation with `Zod`,
- strict idempotency based on the file SHA-256 hash,
- local PDF storage on disk,
- persistence in PostgreSQL with Prisma,
- status notifications to Slack from n8n.

### Out of scope for this version

- OCR for scanned documents or AI-assisted processing,
- support for multiple invoice formats,
- manual re-processing via API,
- cloud storage (S3),
- API authentication or multi-user access,
- distributed architecture or microservices.

## System architecture

The project is composed of an automation flow with n8n, a Node.js backend API, and a PostgreSQL database to persist the results.

### Main components

- n8n: receives the email, extracts the PDF attachment, and sends it to the API.
- Node.js API: processes the document, applies validations, and persists results.
- PostgreSQL: stores document metadata and extracted invoice data.
- Local storage: saves processed PDFs on disk for traceability.

### Conceptual diagram

```text
Email / Gmail
     |
     v
   n8n
     |
     | POST /api/documents
     v
  Node.js API
     |
     +--> PDF validation
     +--> SHA-256 hash
     +--> text extraction
     +--> Zod validation
     +--> local storage
     +--> Prisma transaction
     |
     v
 PostgreSQL
     |
     +--> Document
     +--> Invoice
```

## Technology stack

- Node.js 20
- TypeScript
- Express
- Prisma ORM
- PostgreSQL 15
- Docker / Docker Compose
- n8n
- `pdf-parse`
- `Zod`
- `Multer`
- Jest + Supertest (unit and integration tests)

## Project structure

```text
Document-Flow-Automation/
├── src/
│   ├── api/
│   │   ├── app.ts
│   │   ├── controller.ts
│   │   └── router.ts
│   ├── core/
│   │   └── processDocument/
│   ├── domain/
│   ├── infrastructure/
│   │   ├── database/
│   │   └── repositories/
│   ├── middleware/
│   ├── schemas/
│   ├── utils/
│   └── index.ts
├── prisma/
│   └── schema.prisma
├── test/
│   ├── unit/
│   └── integration/
├── .env.example
├── .env.test.example
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── package.json
├── tsconfig.json
├── storage/
├── README.md
├── README.es.md
└── ...
```

## Data model

The database is modeled with two main entities: `Document` and `Invoice`.

### Document

- `id` (UUID)
- `filename`
- `hash` (unique, idempotency key)
- `status` (`PENDING`, `SUCCESS`, `FAILED`)
- `errorMessage` (nullable)
- `createdAt`

### Invoice

- `id` (UUID)
- `documentId` (unique 1:1 relation with `Document`)
- `invoiceNumber`
- `issuerName`
- `total`
- `createdAt`

The database is resolved with Prisma and the real definition is in `prisma/schema.prisma`.

## API

The API exposes a minimal set of endpoints designed for functional demonstration.

### POST /api/documents

Receives a PDF through `multipart/form-data` in the `file` field.

Behavior:

1. validates that the file exists and is a PDF,
2. calculates the SHA-256 hash,
3. checks whether it was already processed,
4. saves the file in `storage`,
5. extracts data from the PDF,
6. validates the schema,
7. persists `Document` and `Invoice` in a transaction.

Expected response codes:

- `201 Created`: document processed successfully,
- `400 Bad Request`: missing or invalid file,
- `409 Conflict`: document already processed,
- `422 Unprocessable Entity`: unexpected format or invalid data.

### GET /api/documents/:id

Returns the document status, hash, and error if any occurred.

### GET /api/invoices

Returns a list of processed invoices with a demo-oriented limit.

## Processing flow and idempotency

The workflow applies these stages:

1. file reception via the API,
2. validation of the PDF type and structure,
3. SHA-256 hash calculation in memory,
4. existence check by `hash` in the database,
5. duplicate blocking with `409 Conflict`,
6. saving the file in local storage,
7. text extraction with `pdf-parse` and regex,
8. validation with `Zod` to ensure required fields,
9. atomic persistence of `Document` and `Invoice`.

## Requirements

- Node.js 20+
- npm
- Docker and Docker Compose
- PostgreSQL (optional if only the API is run locally against an external instance)

## Quick start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Copy the examples:

```bash
cp .env.example .env
cp .env.test.example .env.test
```

Main variables:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/documentflow?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=documentflow
POSTGRES_PORT=5432
API_PORT=3000
N8N_PORT=5678
```

### 3) Start the database

```bash
docker compose up -d db
```

### 4) Run Prisma migrations

```bash
npx prisma migrate dev
```

### 5) Run the API in development mode

```bash
npm run dev
```

The API will be available at:

- `http://localhost:3000`

### 6) Start the full stack with Docker Compose

```bash
docker compose up -d
```

This starts:

- `api`
- `db`
- `n8n`

## Tests

The project includes high-value tests focused on the central parser logic and the integration flow.

### Unit tests

```bash
npm test
```

### Test database

```bash
docker compose --profile testing up -d --wait test-db
```

### Integration tests

```bash
npm run test:integration
```
