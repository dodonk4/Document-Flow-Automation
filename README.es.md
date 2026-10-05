[🇪🇸 Español](README.es.md) | [🇬🇧 English](README.md)

# Document-Flow-Automation

Document-Flow-Automation es una solución backend para automatizar la recepción, validación y almacenamiento de facturas recibidas por correo electrónico. El flujo está pensado para procesar documentos PDF, extraer la información relevante y guardarla en una base de datos para que el dato quede disponible para consultas y seguimiento.

El sistema está diseñado como un monolito modular orquestado por n8n y con una capa de negocio separada para facilitar pruebas, mantenimiento y demostración técnica.

## Objetivo del proyecto

Resolver el problema de gestión manual de facturas enviadas por email en pequeñas y medianas empresas:

- abrir correos y descargar adjuntos manualmente,
- leer y capturar datos de facturas,
- transcribir información a planillas o sistemas contables,
- duplicar procesos o cometer errores de tipeo,
- perder trazabilidad del documento original.

La solución propuesta automatiza este flujo con una API REST, extracción determinística de datos desde un PDF controlado y persistencia estructurada de los resultados.

## Alcance de la versión actual

### Incluye

- escucha de correos vía IMAP usando n8n,
- procesamiento de un único formato de factura PDF controlado,
- extracción de texto con `pdf-parse`,
- validación de esquema con `Zod`,
- idempotencia estricta basada en hash SHA-256 del archivo,
- almacenamiento local del PDF en disco,
- persistencia en PostgreSQL con Prisma,
- notificaciones de estado a Slack desde n8n.

### Fuera de alcance de esta versión

- OCR para documentos escaneados o IA,
- soporte para múltiples formatos de factura,
- re-procesamiento manual por API,
- almacenamiento en la nube (S3),
- autenticación de API o multiusuario,
- arquitectura distribuida o microservicios.

## Arquitectura del sistema

El proyecto está compuesto por un flujo de automatización con n8n, una API backend en Node.js y una base de datos PostgreSQL para persistir los resultados.

### Componentes principales

- n8n: recibe el correo, extrae el adjunto PDF y lo envía a la API.
- Node.js API: procesa el documento, aplica validaciones y persiste resultados.
- PostgreSQL: almacena los metadatos del documento y la factura extraída.
- Storage local: guarda los PDFs procesados en disco para trazabilidad.

### Diagrama conceptual

```text
Correo / Gmail
     |
     v
   n8n
     |
     | POST /api/documents
     v
  Node.js API
     |
     +--> validación de PDF
     +--> hash SHA-256
     +--> extracción de texto
     +--> validación Zod
     +--> almacenamiento local
     +--> transacción Prisma
     |
     v
 PostgreSQL
     |
     +--> Document
     +--> Invoice
```

## Stack tecnológico

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
- Jest + Supertest (pruebas unitarias e integración)

## Estructura del proyecto

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

## Modelo de datos

La base se modela con dos entidades principales: `Document` e `Invoice`.

### Document

- `id` (UUID)
- `filename`
- `hash` (único, clave de idempotencia)
- `status` (`PENDING`, `SUCCESS`, `FAILED`)
- `errorMessage` (nullable)
- `createdAt`

### Invoice

- `id` (UUID)
- `documentId` (único, relación 1:1 con `Document`)
- `invoiceNumber`
- `issuerName`
- `total`
- `createdAt`

La base de datos queda resuelta con Prisma y la definición real se encuentra en `prisma/schema.prisma`.

## API

La API expone un conjunto mínimo de endpoints orientados a la demostración funcional.

### POST /api/documents

Recibe un PDF vía multipart/form-data en el campo `file`.

Comportamiento:

1. valida que el archivo exista y sea un PDF,
2. calcula el SHA-256,
3. verifica si ya fue procesado,
4. guarda el archivo en `storage`,
5. extrae los datos del PDF,
6. valida el esquema,
7. persiste `Document` e `Invoice` en una transacción.

Códigos esperados:

- `201 Created`: documento procesado correctamente,
- `400 Bad Request`: archivo faltante o inválido,
- `409 Conflict`: documento ya procesado,
- `422 Unprocessable Entity`: formato no esperado o datos inválidos.

### GET /api/documents/:id

Devuelve el estado del documento, su hash y el error si existió.

### GET /api/invoices

Retorna un listado de facturas procesadas, con el límite orientado a demo.

## Flujo de procesamiento e idempotencia

El flujo de trabajo aplica estas etapas:

1. recepción del archivo por la API,
2. validación del tipo y estructura del PDF,
3. cálculo del hash SHA-256 en memoria,
4. consulta de existencia por `hash` en la base de datos,
5. bloqueo de duplicados con `409 Conflict`,
6. guarda del archivo en almacenamiento local,
7. extracción de texto con `pdf-parse` y regex,
8. validación con `Zod` para asegurar campos obligatorios,
9. persistencia atómica de `Document` e `Invoice`.

## Requisitos

- Node.js 20+
- npm
- Docker y Docker Compose
- PostgreSQL (opcional si se arranca solamente la API localmente con una instancia externa)

## Inicio rápido

### 1) Instalar dependencias

```bash
npm install
```

### 2) Configurar variables de entorno

Copia los ejemplos:

```bash
cp .env.example .env
cp .env.test.example .env.test
```

Variables principales:

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

### 3) Levantar base de datos

```bash
docker compose up -d db
```

### 4) Ejecutar migraciones de Prisma

```bash
npx prisma migrate dev
```

### 5) Generar el cliente de Prisma

```bash
npx prisma generate
```

### 6) Ejecutar la API en modo desarrollo

```bash
npm run dev
```

La API quedará disponible en:

- `http://localhost:3000`

Elige una sola modalidad para la API: usa `npm run dev` para desarrollo local o el servicio `api` de Docker Compose para levantar el stack completo. Ambos usan el puerto 3000 por defecto, por lo que debes detener `npm run dev` antes de iniciar el stack completo. No se deben ejecutar los dos al mismo tiempo.

### 7) Levantar el stack completo con Docker Compose

```bash
docker compose up -d
```

Al ejecutar este comando, Compose levanta `db`, `api` y `n8n-import`. Este último es un contenedor de una sola ejecución que importa el workflow desde `.n8n/workflows/document-flow-automation-workflow.json`. Monta ese archivo en `/data/workflows` y comparte el volumen `n8n_data` con `n8n`; así, el workflow queda guardado en la instancia y disponible al abrir `http://localhost:5678`. El servicio `n8n` espera a que la importación termine correctamente antes de arrancar.

El stack incluye:

- `api`
- `db`
- `n8n`
- `n8n-import` (importa el workflow y luego termina)

## Pruebas

El proyecto cuenta con pruebas de alto valor orientadas a la lógica central del parser y el flujo de integración.

### Pruebas unitarias

```bash
npm test
```

### Base de datos de prueba

```bash
docker compose --profile testing up -d --wait test-db
```

### Pruebas de integración

```bash
npm run test:integration
```
