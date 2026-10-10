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

### 5) Generate the Prisma client

```bash
npx prisma generate
```

### 6) Run the API in development mode

```bash
npm run dev
```

The API will be available at:

- `http://localhost:3000`

Choose one API runtime: use `npm run dev` for local development, or the `api` service in Docker Compose for the full stack. Both use port 3000 by default, so stop `npm run dev` before starting the full stack; do not run both at the same time.

### 7) Start the full stack with Docker Compose

```bash
docker compose up -d
```

This command starts `db`, `api`, and `n8n-import`. The latter is a one-off container that imports the workflow from `.n8n/workflows/document-flow-automation-workflow.json`. It mounts that file at `/data/workflows` and shares the `n8n_data` volume with `n8n`, so the workflow is saved in the instance and available at `http://localhost:5678`. The `n8n` service waits for the import to complete successfully before starting.

The stack includes:

- `api`
- `db`
- `n8n`
- `n8n-import` (imports the workflow and then exits)

## Google Drive integration

After the API returns `201`, the n8n workflow uploads the original PDF to a Google Drive folder and then notifies Slack with a link. Duplicates (`409`) are never uploaded. No new environment variables or database changes are needed.

Flow: `201` → *Preparar PDF para Drive* → *Drive: subir PDF* (3 attempts, 2s apart) → Slack success message with the Drive link; if the upload still fails, Slack reports "registered in the database but Drive upload failed, needs review" instead of a success message.

File names are `<issuerName>_<invoiceNumber>_<first 8 chars of documentId>.pdf` (sanitized, accents removed), so different documents never overwrite each other.

### Setup in n8n

1. Open `http://localhost:5678` and, in the imported workflow, open the **Drive: subir PDF** node.
2. Create a **Google Drive OAuth2** credential (Google Cloud project with the Drive API enabled, OAuth client with redirect URI `http://localhost:5678/rest/oauth2-credential/callback`). Credentials live only in n8n, never in the repo.
3. In the node, pick the destination folder (create a private folder in Drive first). Share it only with the people who need access; files are not made public and the Slack link only opens for users with Drive access.
4. Re-select the Gmail and Slack credentials if your instance does not have them, then activate the workflow.

### Consistency and recovery

PostgreSQL, Drive and Slack cannot be updated atomically. The PDF is still kept in the API storage volume (`local_storage`, named `<documentId>.pdf`), so if the Drive upload fails after the invoice is saved, the Slack alert includes the `documentId` and the file can be uploaded manually. Reprocessing the same file returns `409` and is ignored, so recovery is manual by design. If a later step fails after upload, the Drive file already exists; the invoice remains registered.

### Manual verification

- **Case A / B**: send an email with a valid invoice PDF (then a different one). Each should appear in the Drive folder and in Slack with a link.
- **Case C**: resend the exact same PDF. Slack reports a duplicate and no new file appears in Drive.
- **Failure**: revoke the Drive credential and send a new invoice; Slack should report the Drive failure.

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
